import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const messages = sqliteTable("messages", {
  id: int().primaryKey({ autoIncrement: true }),
  body: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Message = typeof messages.$inferSelect;

// The timetable is deliberately small: four sample courses, two possible
// meetings for each, and one saved meeting per course in a shared demo plan.
export const courses = sqliteTable("courses", {
  id: int().primaryKey(),
  code: text().notNull().unique(),
  title: text().notNull(),
  description: text().notNull(),
  poster: text().notNull(),
  accent: text().notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: int().primaryKey(),
  courseId: int("course_id").notNull().references(() => courses.id),
  label: text().notNull(),
  day: int().notNull(), // 0 = Monday, 4 = Friday
  startMinute: int("start_minute").notNull(),
  endMinute: int("end_minute").notNull(),
  location: text().notNull(),
}, (table) => [uniqueIndex("session_course_label").on(table.courseId, table.label)]);

export const planSelections = sqliteTable("plan_selections", {
  courseId: int("course_id").primaryKey().references(() => courses.id),
  sessionId: int("session_id").notNull().unique().references(() => sessions.id),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type Course = typeof courses.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PlanSelection = typeof planSelections.$inferSelect;
