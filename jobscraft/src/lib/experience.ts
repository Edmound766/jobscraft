import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { experiences } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "./session";

export const listExperiences = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return db.select().from(experiences).where(eq(experiences.userId, user.id));
});

export const createExperience = createServerFn({ method: "POST" })
  .validator((d: {
    title: string; company: string; startDate: string; endDate?: string;
    bullets: string[]; techStack: string[];
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db.insert(experiences).values({ ...data, userId: user.id }).returning();
    return row;
  });

export const deleteExperience = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireUser();
    await db.delete(experiences).where(and(eq(experiences.id, id), eq(experiences.userId, user.id)));
  });
