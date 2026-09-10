import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { experiences, projects, roleViews } from "~/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "./session";
import { generateUniqueSlug } from "./slug";
import { rankEntries } from "./rank";

export const createRoleView = createServerFn({ method: "POST" })
  .validator((d: { roleTitle: string; jobDescription: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();

    const [userExperiences, userProjects] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.userId, user.id)),
      db.select().from(projects).where(eq(projects.userId, user.id)),
    ]);

    const { rankedExperiences, rankedProjects } = rankEntries(
      data.jobDescription,
      userExperiences,
      userProjects
    );

    // keep entries with any signal; fall back to everything if nothing scored
    const keptExperiences = rankedExperiences.filter((e) => e.score > 0);
    const keptProjects = rankedProjects.filter((p) => p.score > 0);

    const selectedExperienceIds = (keptExperiences.length ? keptExperiences : rankedExperiences).map((e) => e.id);
    const selectedProjectIds = (keptProjects.length ? keptProjects : rankedProjects).map((p) => p.id);

    const totalPossible = userExperiences.length + userProjects.length;
    const totalMatched = keptExperiences.length + keptProjects.length;
    const matchScore = totalPossible ? Math.round((totalMatched / totalPossible) * 100) : 0;

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
