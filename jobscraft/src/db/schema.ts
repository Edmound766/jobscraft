// src/db/schema.ts
import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Master repository — one row per work experience
export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"), // null = current
  bullets: jsonb("bullets").$type<string[]>().notNull().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
});

// Master repository — projects / proof-of-work
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  liveUrl: text("live_url"),
  repoUrl: text("repo_url"),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
  metrics: text("metrics"), // e.g. "cut invoice processing time by 40%"
});

// Master repository — flat skills list
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
});

// A published, role-tailored view generated from the master data
export const roleViews = pgTable("role_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  slug: text("slug").notNull().unique(), // -> jobscraft.com/u/{slug}
  roleTitle: text("role_title").notNull(),
  jobDescription: text("job_description").notNull(),
  selectedExperienceIds: jsonb("selected_experience_ids").$type<string[]>().notNull(),
  selectedProjectIds: jsonb("selected_project_ids").$type<string[]>().notNull(),
  matchScore: integer("match_score").notNull().default(0),
  defaultView: text("default_view", { enum: ["interactive", "minimal"] }).notNull().default("interactive"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
