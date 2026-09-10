import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "./session";

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return db.select().from(projects).where(eq(projects.userId, user.id));
});

export const createProject = createServerFn({ method: "POST" })
  .validator((d: {
    name: string; description: string; liveUrl?: string; repoUrl?: string;
    techStack: string[]; metrics?: string;
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db.insert(projects).values({ ...data, userId: user.id }).returning();
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireUser();
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  });
