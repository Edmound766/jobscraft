import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { profiles } from "~/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "./session";

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  return row ?? null;
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator((d: { summary: string }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db
      .insert(profiles)
      .values({ userId: user.id, summary: data.summary })
      .onConflictDoUpdate({ target: profiles.userId, set: { summary: data.summary } })
      .returning();
    return row;
  });
