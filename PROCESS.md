# Process overview

## What I built

Weekform is a four-course ANU timetable concept. It lets someone choose one meeting time for each course and see the saved result in a weekly view. The courses and times are sample data, so the app is useful as a prototype without claiming to be the official timetable.

## How I got here

I asked the agent to read the [C7 brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/07-anu-system/) and the repository before changing anything. The brief was marked draft when we read it. Its fixed spec called for a narrow ANU system slice, data that survives a reload, a live Fly URL, and a traceable process. The starter already had Astro, Drizzle, SQLite, migrations, Fly configuration, and a running-app test harness. That grounded the choice to keep the stack and focus on a timetable planner.

Two parts of my prompt set the direction:

> The core flow must work end to end and persist after a page reload.

> Do not treat these four posters as isolated images.

The first working checkpoint, [`d64d74c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u7663394/commit/d64d74c), added a course, session, and saved-choice schema with a migration. The UI posts a chosen time to an Astro endpoint. The backend checks that it belongs to the course and does not overlap another saved class, writes it to SQLite, then redirects to a fresh database-backed page. I kept the starter's message and live-event routes as shared week notes so its supplied plumbing check still had a purpose. I generated a desktop design reference and four course posters, then used their subjects and colours in the scroll scene, course choices, and timetable.

The first full check found one accessibility error: a day label used an ARIA attribute on a plain div. I fixed it before the first commit. The built-app suite then passed 30 tests, including a new save, reload, and clash test. Browser inspection confirmed the 3D scene, the 1920×1080 grid, the 390×844 agenda, and a class choice surviving a phone reload. At an intermediate laptop width, the calendar was too narrow beside the chooser. [`073228d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u7663394/commit/073228d) records the switch to an agenda at that width and the project rules in `CLAUDE.md`. I then found and corrected missing agenda styling at that width during a second visual check, recorded in [`9405438`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u7663394/commit/9405438).

The app uses the starter's Dockerfile and Fly volume path for deployment. I have prepared and tested it locally; I have not deployed it or pushed these commits.
