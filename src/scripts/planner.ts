export {};

type Session = {
  id: number;
  courseId: number;
  label: string;
  day: number;
  startMinute: number;
  endMinute: number;
  location: string;
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const status = document.querySelector<HTMLElement>("#plan-live-status");
const feedback = document.querySelector<HTMLElement>("#planner-feedback");

function showStatus(message: string, error = false) {
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", error);
  if (feedback) feedback.hidden = true;
}

function updateSchedule(session: Session) {
  const courseId = session.courseId;
  const event = document.querySelector<HTMLElement>(`.calendar-event[data-course-id="${courseId}"]`);
  const track = document.querySelector<HTMLElement>(`.day-track[data-day="${session.day}"]`);
  if (event && track) {
    event.style.top = `${((session.startMinute - 480) / 60) * 64}px`;
    event.style.height = `${((session.endMinute - session.startMinute) / 60) * 64}px`;
    event.querySelector<HTMLElement>(".event-time")!.textContent = `${time(session.startMinute)}–${time(session.endMinute)}`;
    event.querySelector<HTMLElement>(".event-location")!.textContent = session.location;
    track.append(event);
  }

  const agenda = document.querySelector<HTMLElement>(`.agenda-session[data-course-id="${courseId}"]`);
  const day = document.querySelector<HTMLElement>(`.agenda-day[data-day="${session.day}"]`);
  if (agenda && day) {
    agenda.dataset.start = String(session.startMinute);
    agenda.querySelector<HTMLElement>(".agenda-time")!.textContent = `${time(session.startMinute)}–${time(session.endMinute)}`;
    agenda.querySelector<HTMLElement>(".agenda-location")!.textContent = session.location;
    day.append(agenda);
  }
  document.querySelectorAll<HTMLElement>(".agenda-day").forEach((day) => {
    const items = Array.from(day.querySelectorAll<HTMLElement>(".agenda-session"))
      .sort((a, b) => Number(a.dataset.start) - Number(b.dataset.start));
    items.forEach((item) => day.append(item));
    const empty = day.querySelector<HTMLElement>(".agenda-empty");
    if (items.length === 0 && !empty) {
      const message = document.createElement("p");
      message.className = "agenda-empty";
      message.textContent = "No classes planned";
      day.append(message);
    } else if (items.length > 0) {
      empty?.remove();
    }
  });

  const choice = document.querySelector<HTMLElement>(`.course-choice[data-course-id="${courseId}"]`);
  if (choice) {
    choice.querySelector<HTMLElement>(".choice-current")!.textContent = `${days[session.day]} · ${time(session.startMinute)}`;
    choice.querySelectorAll<HTMLButtonElement>(".option-button").forEach((button) => {
      const selected = Number(button.value) === session.id;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }
}

document.querySelectorAll<HTMLFormElement>('form[action="/api/plan"]').forEach((form) => {
  form.addEventListener("submit", async (event) => {
    const button = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const courseId = form.querySelector<HTMLInputElement>('input[name="courseId"]')?.value;
    if (!button || !courseId) return; // Keep the browser's normal form fallback.
    event.preventDefault();
    const choice = form.closest<HTMLElement>(".course-choice");
    const buttons = choice?.querySelectorAll<HTMLButtonElement>(".option-button") ?? [];
    buttons.forEach((option) => (option.disabled = true));
    showStatus("Saving class time…");
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ courseId, sessionId: button.value }),
      });
      const result = await response.json() as { ok: boolean; reason?: string; session?: Session };
      if (!response.ok || !result.ok || !result.session) {
        showStatus(result.reason === "clash"
          ? "That time overlaps another class. Choose a different option."
          : "That class time could not be saved.", true);
        return;
      }
      updateSchedule(result.session);
      showStatus(`${result.session.label} saved. Your timetable is up to date.`);
      if (location.search) history.replaceState(null, "", location.pathname + location.hash);
    } catch {
      showStatus("Could not save. Check your connection and try again.", true);
    } finally {
      buttons.forEach((option) => (option.disabled = false));
    }
  });
});
