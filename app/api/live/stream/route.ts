import { liveStore, liveState } from "@/lib/live/store";
import type { LiveTelemetryState } from "@/lib/live/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream for live telemetry updates.
 *
 * On connect, sends the current store state as the first event. Subsequent
 * POSTs to /api/live broadcast to all connected subscribers via the shared
 * in-memory store. EventSource auto-reconnects on disconnect, so a serverless
 * timeout simply triggers a reconnect with a fresh initial-state event.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: LiveTelemetryState) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          liveStore.subscribers.delete(send);
        }
      };

      send(liveState());
      liveStore.subscribers.add(send);

      request.signal.addEventListener("abort", () => {
        liveStore.subscribers.delete(send);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
