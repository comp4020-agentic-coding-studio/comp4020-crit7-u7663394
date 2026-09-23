# Crit 7 reflection

## What was the breakthrough that moved the work forward?

The breakthrough was treating the timetable as saved data rather than as a picture of a timetable. Once I limited the scope to four courses and one choice per course, the database model was small enough to understand. A class button now goes through the backend, gets checked for clashes, and returns as a saved class after a reload. The visual work became more useful when the same course image and colour followed a course from the scroll scene into the working timetable.

## What did this change about who I want to be as a software developer?

I want to build expressive interfaces that still explain their state clearly and work without their effects. The browser check caught a cramped laptop layout that the automated tests could not see. That pushed me to check the real reading experience at different widths, while keeping the database and tests as the evidence that the core flow works.
