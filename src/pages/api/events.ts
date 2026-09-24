import type { APIRoute } from "astro";
import type { Message } from "../../lib/db";
import { bus } from "../../lib/events";

// The minimal server-sent-events (SSE) pattern: a long-lived streaming
// response the browser consumes with `new EventSource("/api/events")`.
// SSE is one-directional (server → browser) and plain HTTP, which makes it
// the simplest live channel that works everywhere — reach for WebSockets
// only when the client needs to push over the same connection.
export const GET: APIRoute = () => {
  let onMessage: (message: Message) => void;
  let onUpdate: (message: Message) => void;
  let onDelete: (payload: { id: number }) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      // an opening comment so the client (and the post-deploy CI probe) sees
      // bytes immediately, and a periodic one so proxies don't drop the
      // connection as idle
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onMessage = (message) => {
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      };
      onUpdate = (message) => {
        controller.enqueue(`event: note-updated\ndata: ${JSON.stringify(message)}\n\n`);
      };
      onDelete = (payload) => {
        controller.enqueue(`event: note-deleted\ndata: ${JSON.stringify(payload)}\n\n`);
      };
      bus.on("message", onMessage);
      bus.on("message:update", onUpdate);
      bus.on("message:delete", onDelete);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("message", onMessage);
      bus.off("message:update", onUpdate);
      bus.off("message:delete", onDelete);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
