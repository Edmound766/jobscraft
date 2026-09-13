import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { education } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "./session";

export const listEducation = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return db.select().from(education).where(eq(education.userId, user.id));
});

export const createEducation = createServerFn({ method: "POST" })
  .validator((d: {
    school: string; degree: string; fieldOfStudy?: string; startDate: string; endDate?: string;
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db.insert(education).values({ ...data, userId: user.id }).returning();
    return row;
  });

export const deleteEducation = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireUser();
    await db.delete(education).where(and(eq(education.id, id), eq(education.userId, user.id)));
  });

export const updateEducation = createServerFn({ method: "POST" })
  .validator((d: {
    id: string; school: string; degree: string; fieldOfStudy?: string; startDate: string; endDate?: string;
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { id, ...updates } = data;
    const [row] = await db
      .update(education)
      .set(updates)
      .where(and(eq(education.id, id), eq(education.userId, user.id)))
      .returning();
    if (!row) throw new Error("not found");
    return row;
  });
