import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { experiences, projects, roleViews } from "~/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";
import { requireUser } from "./session";
import { generateUniqueSlug } from "./slug";
import { rankEntries } from "./rank";
import { semanticRank } from "./agentRank";

function rankWithKeywords(
  jobDescription: string,
  userExperiences: (InferSelectModel<typeof experiences>)[],
  userProjects: (InferSelectModel<typeof projects>)[]
) {
  const { rankedExperiences, rankedProjects } = rankEntries(jobDescription, userExperiences, userProjects);

  // keep entries with any signal; fall back to everything if nothing scored
  const keptExperiences = rankedExperiences.filter((e) => e.score > 0);
  const keptProjects = rankedProjects.filter((p) => p.score > 0);

  const selectedExperienceIds = (keptExperiences.length ? keptExperiences : rankedExperiences).map((e) => e.id);
  const selectedProjectIds = (keptProjects.length ? keptProjects : rankedProjects).map((p) => p.id);

  const totalPossible = userExperiences.length + userProjects.length;
  const totalMatched = keptExperiences.length + keptProjects.length;
  const matchScore = totalPossible ? Math.round((totalMatched / totalPossible) * 100) : 0;

  return { selectedExperienceIds, selectedProjectIds, matchScore };
}

async function rankWithAgent(
  jobDescription: string,
  userExperiences: (InferSelectModel<typeof experiences>)[],
  userProjects: (InferSelectModel<typeof projects>)[]
) {
  const entries = [
    ...userExperiences.map((e) => ({
      id: e.id,
      kind: "experience" as const,
      text: e.bullets.join(" "),
      techStack: e.techStack,
    })),
    ...userProjects.map((p) => ({
      id: p.id,
      kind: "project" as const,
      text: p.description,
      techStack: p.techStack,
    })),
  ];

  const rankings = await semanticRank(jobDescription, entries);
  const scoreById = new Map(rankings.map((r) => [r.id, r.score]));

  const scoredExperiences = userExperiences
    .map((e) => ({ ...e, score: scoreById.get(e.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const scoredProjects = userProjects
    .map((p) => ({ ...p, score: scoreById.get(p.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // keep entries with any signal; fall back to everything if nothing scored
  const keptExperiences = scoredExperiences.filter((e) => e.score > 0);
  const keptProjects = scoredProjects.filter((p) => p.score > 0);

  const selected = [
    ...(keptExperiences.length ? keptExperiences : scoredExperiences),
    ...(keptProjects.length ? keptProjects : scoredProjects),
  ];

  const selectedExperienceIds = (keptExperiences.length ? keptExperiences : scoredExperiences).map((e) => e.id);
  const selectedProjectIds = (keptProjects.length ? keptProjects : scoredProjects).map((p) => p.id);
  const matchScore = selected.length
    ? Math.round(selected.reduce((sum, e) => sum + e.score, 0) / selected.length)
    : 0;

  return { selectedExperienceIds, selectedProjectIds, matchScore };
}

export const createRoleView = createServerFn({ method: "POST" })
  .validator((d: { roleTitle: string; jobDescription: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [userExperiences, userProjects] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.userId, user.id)),
      db.select().from(projects).where(eq(projects.userId, user.id)),
    ]);

    let selectedExperienceIds: string[];
    let selectedProjectIds: string[];
    let matchScore: number;

    try {
      ({ selectedExperienceIds, selectedProjectIds, matchScore } = await rankWithAgent(
        data.jobDescription,
        userExperiences,
        userProjects
      ));
    } catch (err) {
      console.error("semanticRank failed, falling back to keyword ranking:", err);
      ({ selectedExperienceIds, selectedProjectIds, matchScore } = rankWithKeywords(
        data.jobDescription,
        userExperiences,
        userProjects
      ));
    }

    const slug = await generateUniqueSlug(user.name ?? "candidate", data.roleTitle);

    const [row] = await db
      .insert(roleViews)
      .values({
        userId: user.id,
        slug,
        roleTitle: data.roleTitle,
        jobDescription: data.jobDescription,
        selectedExperienceIds,
        selectedProjectIds,
        matchScore,
        isPublished: true,
      })
      .returning();

    return row;
  });

export const getRoleView = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [role] = await db.select().from(roleViews).where(eq(roleViews.slug, slug));
    if (!role || !role.isPublished) return null;

    const [allExperiences, allProjects] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.userId, role.userId)),
      db.select().from(projects).where(eq(projects.userId, role.userId)),
    ]);

    const selectedExperiences = allExperiences
      .filter((e) => role.selectedExperienceIds.includes(e.id))
      .sort((a, b) => role.selectedExperienceIds.indexOf(a.id) - role.selectedExperienceIds.indexOf(b.id));

    const selectedProjects = allProjects
      .filter((p) => role.selectedProjectIds.includes(p.id))
      .sort((a, b) => role.selectedProjectIds.indexOf(a.id) - role.selectedProjectIds.indexOf(b.id));

    return { role, experiences: selectedExperiences, projects: selectedProjects };
  });
