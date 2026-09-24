import type { APIRoute } from "astro";
import { addMessage, deleteMessage, updateMessage } from "../../lib/db";
import { bus } from "../../lib/events";

// Forms remain usable without JavaScript. An Accept: application/json request
// lets the enhanced UI update in place after the database write succeeds.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "create");
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const body = String(form.get("body") ?? "").trim().slice(0, 500);
  const id = Number(form.get("id"));
  const validId = Number.isSafeInteger(id) && id > 0;

  const json = (value: object, status: number) => new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
  const fail = (reason: string, status: number) =>
    wantsJson ? json({ ok: false, reason }, status) : redirect(`/?note-error=${reason}#notes`, 303);

  if (intent === "create") {
    if (!body) return fail("empty", 400);
    const message = addMessage(body);
    bus.emit("message", message); // Preserve the starter's default SSE event.
    return wantsJson ? json({ ok: true, action: "created", message }, 201) : redirect("/", 303);
  }
  if (!validId) return fail("invalid", 400);
  if (intent === "update") {
    if (!body) return fail("empty", 400);
    const message = updateMessage(id, body);
    if (!message) return fail("missing", 404);
    bus.emit("message:update", message);
    return wantsJson ? json({ ok: true, action: "updated", message }, 200) : redirect("/?note=updated#notes", 303);
  }
  if (intent === "delete") {
    const message = deleteMessage(id);
    if (!message) return fail("missing", 404);
    bus.emit("message:delete", { id });
    return wantsJson ? json({ ok: true, action: "deleted", id }, 200) : redirect("/?note=deleted#notes", 303);
  }
  return fail("invalid", 400);
};
