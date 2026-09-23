import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courses, messages, planSelections, sessions, type Course, type Message, type PlanSelection, type Session } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

const sampleCourses: Course[] = [
  { id: 1, code: "STUDIO 01", title: "Creative computing", description: "Shape ideas with code, systems and playful problem solving.", poster: "/posters/computing.webp", accent: "#2457be" },
  { id: 2, code: "STUDIO 02", title: "History of ideas", description: "Follow the people, places and texts that changed how we think.", poster: "/posters/history.webp", accent: "#6d2937" },
  { id: 3, code: "STUDIO 03", title: "Visual culture", description: "Read images critically and make meaning through design.", poster: "/posters/visual-culture.webp", accent: "#becf32" },
  { id: 4, code: "STUDIO 04", title: "Astronomy lab", description: "Observe the sky and ask bigger questions about our place in it.", poster: "/posters/astronomy.webp", accent: "#d9793f" },
];

const sampleSessions: Session[] = [
  { id: 1, courseId: 1, label: "Monday studio", day: 0, startMinute: 540, endMinute: 660, location: "Marie Reay 3.02" },
  { id: 2, courseId: 1, label: "Tuesday studio", day: 1, startMinute: 720, endMinute: 840, location: "Marie Reay 3.02" },
  { id: 3, courseId: 2, label: "Tuesday seminar", day: 1, startMinute: 600, endMinute: 720, location: "Coombs 2.07" },
  { id: 4, courseId: 2, label: "Thursday seminar", day: 3, startMinute: 840, endMinute: 960, location: "Coombs 2.07" },
  { id: 5, courseId: 3, label: "Wednesday workshop", day: 2, startMinute: 660, endMinute: 780, location: "School of Art 1.14" },
  { id: 6, courseId: 3, label: "Monday workshop", day: 0, startMinute: 600, endMinute: 720, location: "School of Art 1.14" },
  { id: 7, courseId: 4, label: "Thursday lab", day: 3, startMinute: 540, endMinute: 660, location: "Physics 1.04" },
  { id: 8, courseId: 4, label: "Friday lab", day: 4, startMinute: 780, endMinute: 900, location: "Physics 1.04" },
];

// Stable IDs make seeding idempotent. Existing choices survive server restarts
// and deploys because the inserts never overwrite rows in the SQLite volume.
db.insert(courses).values(sampleCourses).onConflictDoNothing().run();
db.insert(sessions).values(sampleSessions).onConflictDoNothing().run();
db.insert(planSelections).values(sampleCourses.map((course) => ({ courseId: course.id, sessionId: course.id * 2 - 1 }))).onConflictDoNothing().run();

export type PlannerData = { courses: Course[]; sessions: Session[]; selections: PlanSelection[] };

export function getPlannerData(): PlannerData {
  return {
    courses: db.select().from(courses).orderBy(courses.id).all(),
    sessions: db.select().from(sessions).orderBy(sessions.id).all(),
    selections: db.select().from(planSelections).all(),
  };
}

export function saveSelection(courseId: number, sessionId: number): { ok: boolean; reason?: string } {
  const option = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!option || option.courseId !== courseId) return { ok: false, reason: "invalid" };

  const selected = db.select({ courseId: planSelections.courseId, session: sessions })
    .from(planSelections).innerJoin(sessions, eq(planSelections.sessionId, sessions.id)).all();
  const clash = selected.some(({ courseId: otherCourse, session }) =>
    otherCourse !== courseId && session.day === option.day &&
    session.startMinute < option.endMinute && option.startMinute < session.endMinute);
  if (clash) return { ok: false, reason: "clash" };

  db.insert(planSelections).values({ courseId, sessionId })
    .onConflictDoUpdate({ target: planSelections.courseId, set: { sessionId, updatedAt: sql`datetime('now')` } }).run();
  return { ok: true };
}

export type { Message };

export function listMessages(): Message[] {
  return db.select().from(messages).orderBy(desc(messages.id)).limit(50).all();
}

export function addMessage(body: string): Message {
  return db.insert(messages).values({ body }).returning().get();
}
