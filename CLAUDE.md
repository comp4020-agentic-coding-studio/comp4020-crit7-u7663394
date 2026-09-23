# Weekform working rules

Read the [C7 brief and spec](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/07-anu-system/) and the repository before changing the app. Keep the course starter's Astro, Drizzle, SQLite, migration, Fly, and spec harness paths working.

## Product

- Build one useful timetable slice: choose one meeting time for each of four courses and see a readable weekly plan.
- Label the course and room data as illustrative. Do not imply a connection to ANU enrolment or the official timetable.
- Keep class time, day, and location legible on desktop and phone. The expressive artwork must help course recognition without covering the schedule.
- Treat the 3D scene as progressive enhancement. Keep the planner usable without WebGL or motion, and respect reduced-motion settings.

## Data and checks

- Read courses, sessions, and saved choices from SQLite. Send UI changes through an Astro endpoint and validate them before writing.
- Change `src/lib/schema.ts` with a generated, committed Drizzle migration. Do not reset a deployed database or overwrite existing saved choices during seeding.
- Preserve `/readme/`, the guestbook-derived notes and SSE route, and the course tests. Add contract tests for new flows.
- Run `pnpm check` and `pnpm check:evidence` before shipping. Inspect the app at 1920×1080 and 390×844 and verify a saved class survives reload.
- Commit each green checkpoint locally with a scoped, imperative subject. Do not push without the student's deliberate instruction.
