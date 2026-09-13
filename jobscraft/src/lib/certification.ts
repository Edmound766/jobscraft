import { createServerFn } from "@tanstack/solid-start";
import { db } from "~/db";
import { certifications } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "./session";

export const listCertifications = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return db.select().from(certifications).where(eq(certifications.userId, user.id));
});

export const createCertification = createServerFn({ method: "POST" })
  .validator((d: {
    name: string; issuer: string; issueDate?: string; credentialUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const [row] = await db.insert(certifications).values({ ...data, userId: user.id }).returning();
    return row;
  });

export const deleteCertification = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const user = await requireUser();
    await db.delete(certifications).where(and(eq(certifications.id, id), eq(certifications.userId, user.id)));
  });

export const updateCertification = createServerFn({ method: "POST" })
  .validator((d: {
    id: string; name: string; issuer: string; issueDate?: string; credentialUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { id, ...updates } = data;
    const [row] = await db
      .update(certifications)
      .set(updates)
      .where(and(eq(certifications.id, id), eq(certifications.userId, user.id)))
      .returning();
    if (!row) throw new Error("not found");
    return row;
  });
