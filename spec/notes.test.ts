import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const post = (fields: Record<string, string>) => fetch(new URL("/api/messages", baseUrl), {
  method: "POST",
  headers: { origin: baseUrl, accept: "application/json" },
  body: new URLSearchParams(fields),
});

describe("notes CRUD", () => {
  it("creates, updates, and deletes a note with every change persisted on a fresh page load", async () => {
    const original = `note create ${process.hrtime.bigint()}`;
    const edited = `note updated ${process.hrtime.bigint()}`;

    const create = await post({ body: original });
    expect(create.status).toBe(201);
    const created = await create.json();
    expect(created).toMatchObject({ ok: true, action: "created", message: { body: original } });
    const id = String(created.message.id);
    expect(await (await fetch(baseUrl)).text()).toContain(original);

    const update = await post({ intent: "update", id, body: edited });
    expect(update.status).toBe(200);
    expect(await update.json()).toMatchObject({ ok: true, action: "updated", message: { id: Number(id), body: edited } });
    const updatedPage = await (await fetch(baseUrl)).text();
    expect(updatedPage).toContain(edited);
    expect(updatedPage).not.toContain(original);

    const remove = await post({ intent: "delete", id });
    expect(remove.status).toBe(200);
    expect(await remove.json()).toMatchObject({ ok: true, action: "deleted", id: Number(id) });
    expect(await (await fetch(baseUrl)).text()).not.toContain(edited);
  });

  it("rejects invalid note changes without altering stored data", async () => {
    expect((await post({ intent: "update", id: "-1", body: "oops" })).status).toBe(400);
    expect((await post({ intent: "delete", id: "999999999" })).status).toBe(404);
    expect((await post({ body: "   " })).status).toBe(400);
  });
});
