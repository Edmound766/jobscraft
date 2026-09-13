import { createServerFn } from "@tanstack/solid-start";
import { and, desc, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "~/db";
import { certifications, education, experiences, profiles, projects, roleViews, skills } from "~/db/schema";
import { user as userTable } from "~/db/auth-schema";
import { semanticRank } from "./agentRank";
import { rankEntries } from "./rank";
import { getOptionalUser, requireUser } from "./session";
import { generateUniqueSlug } from "./slug";

function rankWithKeywords(
  jobDescription: string,
  userExperiences: (InferSelectModel<typeof experiences>)[],
  userProjects: (InferSelectModel<typeof projects>)[]
) {
  const { rankedExperiences, rankedProjects } = rankEntries(jobDescription, userExperiences, userProjects);

  const KEYWORD_THRESHOLD = 10; // requires at least one real tech-stack match, not just prose overlap
  const keptExperiences = rankedExperiences.filter((e) => e.score >= KEYWORD_THRESHOLD);
  const keptProjects = rankedProjects.filter((p) => p.score >= KEYWORD_THRESHOLD);

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
    const SEMANTIC_THRESHOLD = 40;

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
  const keptExperiences = scoredExperiences.filter((e) => e.score >= SEMANTIC_THRESHOLD);
  const keptProjects = scoredProjects.filter((p) => p.score >= SEMANTIC_THRESHOLD);

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

    const [userExperiences, userProjects, userEducation, userCertifications] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.userId, user.id)),
      db.select().from(projects).where(eq(projects.userId, user.id)),
      db.select().from(education).where(eq(education.userId, user.id)),
      db.select().from(certifications).where(eq(certifications.userId, user.id)),
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

    // Education/certifications are credentials, not achievements to filter by
    // relevance — a resume doesn't trim your degree because the job
    // description didn't mention it, so these are included in full rather
    // than run through the ranking functions above.
    const selectedEducationIds = userEducation.map((e) => e.id);
    const selectedCertificationIds = userCertifications.map((c) => c.id);

    const [row] = await db
      .insert(roleViews)
      .values({
        userId: user.id,
        slug,
        roleTitle: data.roleTitle,
        jobDescription: data.jobDescription,
        selectedExperienceIds,
        selectedProjectIds,
        selectedEducationIds,
        selectedCertificationIds,
        matchScore,
        isPublished: false,
      })
      .returning();

    return row;
  });

export const getRoleView = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const [role] = await db.select().from(roleViews).where(eq(roleViews.slug, slug));
    if (!role) return null;

    const session = await getOptionalUser();
    const isOwner = session?.id === role.userId;

    if (!role.isPublished && !isOwner) {
      // unpublished: only the owner may view it (as a preview)
      return null;
    }

    const [author] = await db.select().from(userTable).where(eq(userTable.id, role.userId));

    const [allExperiences, allProjects, allEducation, allCertifications, allSkills, [profileRow]] = await Promise.all([
      db.select().from(experiences).where(eq(experiences.userId, role.userId)),
      db.select().from(projects).where(eq(projects.userId, role.userId)),
      db.select().from(education).where(eq(education.userId, role.userId)),
      db.select().from(certifications).where(eq(certifications.userId, role.userId)),
      db.select().from(skills).where(eq(skills.userId, role.userId)),
      db.select().from(profiles).where(eq(profiles.userId, role.userId)),
    ]);

    const selectedExperiences = allExperiences
      .filter((e) => role.selectedExperienceIds.includes(e.id))
      .sort((a, b) => role.selectedExperienceIds.indexOf(a.id) - role.selectedExperienceIds.indexOf(b.id));

    const selectedProjects = allProjects
      .filter((p) => role.selectedProjectIds.includes(p.id))
      .sort((a, b) => role.selectedProjectIds.indexOf(a.id) - role.selectedProjectIds.indexOf(b.id));

    const selectedEducation = allEducation
      .filter((e) => role.selectedEducationIds.includes(e.id))
      .sort((a, b) => role.selectedEducationIds.indexOf(a.id) - role.selectedEducationIds.indexOf(b.id));

    const selectedCertifications = allCertifications
      .filter((c) => role.selectedCertificationIds.includes(c.id))
      .sort((a, b) => role.selectedCertificationIds.indexOf(a.id) - role.selectedCertificationIds.indexOf(b.id));

    return {
      role,
      author: { name: author?.name ?? "Candidate", email: author?.email, summary: profileRow?.summary },
      isOwner,
      experiences: selectedExperiences,
      projects: selectedProjects,
      education: selectedEducation,
      certifications: selectedCertifications,
      skills: allSkills,
    };
  });
export const listRoleViews= createServerFn({method:"GET"})
.handler(async()=>{
  const user = await requireUser()
  return db.select()
  .from(roleViews)
  .where(eq(roleViews.userId,user.id))
  .orderBy(desc(roleViews.createdAt))
})

export const togglePublish = createServerFn({method:"POST"})
.validator((id:string)=>id)
.handler(async({data:id})=>{
  const user = await requireUser()
  const [row] = await db.select().from(roleViews).where(and(eq(roleViews.id,id),eq(roleViews.userId,user.id)))
  if(!row) throw new Error("not found ")
  await db.update(roleViews).set({isPublished:!row.isPublished}).where(eq(roleViews.id, id))
})

export const deleteRoleView = createServerFn({method:"POST"})
.validator((id:string)=>id)
.handler(async({data:id})=>{
  const user = await requireUser()
  const [row] = await db.select().from(roleViews).where(and(eq(roleViews.id,id),eq(roleViews.userId,user.id)))
  if(!row) throw new Error("not found ")
  await db.delete(roleViews).where(eq(roleViews.id, id))
})

export const updateRoleViewSelection = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    roleTitle: string;
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
    selectedEducationIds: string[];
    selectedCertificationIds: string[];
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { id, ...updates } = data;
    const [row] = await db
      .update(roleViews)
      .set(updates)
      .where(and(eq(roleViews.id, id), eq(roleViews.userId, user.id)))
      .returning();
    if (!row) throw new Error("not found");
    return row;
  });
