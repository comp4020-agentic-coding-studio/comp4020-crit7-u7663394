import type { APIRoute } from "astro";
import { saveSelection } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const sessionId = Number(form.get("sessionId"));
  const result = Number.isSafeInteger(courseId) && Number.isSafeInteger(sessionId)
    ? saveSelection(courseId, sessionId)
    : { ok: false, reason: "invalid" };
  return redirect(`/${result.ok ? "?saved=1" : `?error=${result.reason}`}#planner`, 303);
};
