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

// Master repository — education history
export const education = pgTable("education", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  school: text("school").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"), // null = in progress
});

// Master repository — certifications
export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  issueDate: text("issue_date"),
  credentialUrl: text("credential_url"),
});

// Master repository — one row per user, profile-level fields not tied to a specific role view
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique().references(() => user.id),
  summary: text("summary"),
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
  selectedEducationIds: jsonb("selected_education_ids").$type<string[]>().notNull().default([]),
  selectedCertificationIds: jsonb("selected_certification_ids").$type<string[]>().notNull().default([]),
  matchScore: integer("match_score").notNull().default(0),
  defaultView: text("default_view", { enum: ["interactive", "minimal"] }).notNull().default("interactive"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
