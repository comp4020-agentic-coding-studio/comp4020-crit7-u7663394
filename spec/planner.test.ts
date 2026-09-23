import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const post = (courseId: number, sessionId: number) =>
  fetch(new URL("/api/plan", baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body: new URLSearchParams({ courseId: String(courseId), sessionId: String(sessionId) }),
    redirect: "manual",
  });

describe("saved timetable", () => {
  it("renders four courses and keeps a changed class after reload", async () => {
    const first = new JSDOM(await (await fetch(baseUrl)).text()).window.document;
    expect(first.querySelectorAll(".course-choice")).toHaveLength(4);

    const saved = await post(1, 2);
    expect(saved.status).toBe(303);
    const fresh = new JSDOM(await (await fetch(baseUrl)).text()).window.document;
    const computing = fresh.querySelector("#course-1");
    expect(computing?.textContent).toContain("Tuesday · 12:00");
    expect(fresh.querySelectorAll(".calendar-event")).toHaveLength(4);
  });

  it("rejects a clash and leaves the earlier choice saved", async () => {
    expect((await post(1, 1)).status).toBe(303);
    const clash = await post(3, 6);
    expect(clash.status).toBe(303);
    expect(clash.headers.get("location")).toContain("error=clash");
    const fresh = new JSDOM(await (await fetch(baseUrl)).text()).window.document;
    expect(fresh.querySelector("#course-3")?.textContent).toContain("Wednesday · 11:00");
  });
});
