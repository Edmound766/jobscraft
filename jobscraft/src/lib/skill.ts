import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { skills } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "./session";

export const listSkills = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return db.select().from(skills).where(eq(skills.userId, user.id));
});

export const createSkill = createServerFn({ method: "POST" })
  .validator((d: { name: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db.insert(skills).values({ ...data, userId: user.id }).returning();
    return row;
  });

export const deleteSkill = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireUser();
    await db.delete(skills).where(and(eq(skills.id, id), eq(skills.userId, user.id)));
  });
