import { db } from "~/db";
import { roleViews } from "~/db/schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function slugExists(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: roleViews.id })
    .from(roleViews)
    .where(eq(roleViews.slug, slug))
    .limit(1);
  return !!row;
}

export async function generateUniqueSlug(name: string, roleTitle: string): Promise<string> {
  const base = slugify(`${name}-${roleTitle}`) || "candidate";

  let slug = base;
  let suffix = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
}
