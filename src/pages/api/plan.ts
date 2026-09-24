import type { APIRoute } from "astro";
import { getPlannerData, saveSelection } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const sessionId = Number(form.get("sessionId"));
  const result = Number.isSafeInteger(courseId) && Number.isSafeInteger(sessionId)
    ? saveSelection(courseId, sessionId)
    : { ok: false, reason: "invalid" };
  if (request.headers.get("accept")?.includes("application/json")) {
    const session = result.ok ? getPlannerData().sessions.find((option) => option.id === sessionId) : undefined;
    return new Response(JSON.stringify(result.ok ? { ok: true, session } : result), {
      status: result.ok ? 200 : result.reason === "clash" ? 409 : 400,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return redirect(`/${result.ok ? "?saved=1" : `?error=${result.reason}`}#planner`, 303);
};
