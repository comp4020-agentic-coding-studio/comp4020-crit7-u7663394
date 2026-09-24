# Weekform

Weekform is a small, independent ANU timetable concept. A student sees four illustrative courses, chooses one meeting time for each, and sees the saved choices in a weekly view. Choosing a time updates the timetable in place after the Astro backend validates it and writes it to SQLite. The plan survives a reload. The shared notes area supports adding, editing, and deleting notes in place, and uses the starter's live update stream to keep open pages current.

## What good looks like here

A useful timetable should make class times easy to compare and should stop a choice that overlaps another saved class. The weekly view has to stay readable on a phone, where it becomes a day-by-day agenda. The four visual identities give each course a recognisable image and colour without hiding the timetable details. The scroll scene adds depth on larger screens; reduced motion and small screens show the course artwork as ordinary images.

The [C7 brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/07-anu-system/) asks for a narrow ANU system slice with real persistence. The course starter already supplied Astro, Drizzle, SQLite migrations, Fly configuration, and a running-app test harness. Weekform keeps that stack and tests the save-and-reload flows in `spec/planner.test.ts` and `spec/notes.test.ts`. The forms still work when JavaScript is unavailable.

The courses, rooms, and times are illustrative. Weekform is not connected to ANU enrolment or the official timetable. The saved plan and notes are shared by everyone using this demo, rather than tied to an account.

## Run it locally

Run `pnpm install`, then `pnpm dev`. The database is created in `.data/app.db`; migrations run when the server starts. Run `pnpm check` for type checks and the built-app tests. Deployment uses the existing Dockerfile and Fly volume configuration, with `DATABASE_PATH=/data/app.db`.
