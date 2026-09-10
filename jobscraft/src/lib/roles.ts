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
