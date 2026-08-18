"use client";

/**
 * useBoardRealtime — subscribes to Supabase Realtime for live board updates.
 *
 * When enabled, opens a WebSocket channel watching metric_snapshots INSERTs
 * and leaderboards_cached UPDATEs. On any change, calls onRefresh() so the
 * board can refetch and animate rank changes without a page reload.
 *
 * ON/OFF SWITCH:
 *   NEXT_PUBLIC_REALTIME_ENABLED — env var, accepts "1" or "true".
 *   When false/absent, the hook is a no-op (no WebSocket, no Supabase call).
 *   This is the kill switch if Realtime starts costing money.
 *
 * Free plan quota: 200 concurrent connections, 2M messages/mo.
 * Each board viewer = 1 connection. Each snapshot submit = 1 message broadcast.
 * You'd need 200 simultaneous viewers to hit the connection cap.
 */

import { useEffect, useRef } from "react";
import { getSupabaseBrowser, SUPABASE_CONFIGURED } from "@/lib/infra/supabase/client";

const REALTIME_ENABLED =
  process.env.NEXT_PUBLIC_REALTIME_ENABLED === "1" ||
  process.env.NEXT_PUBLIC_REALTIME_ENABLED === "true";

interface Options {
  /** Called when a realtime event fires — typically refetches board data. */
  onRefresh: () => void;
  /** Debounce window in ms (default 2000). Prevents rapid-fire refreshes when
   *  multiple snapshots land at once. */
  debounceMs?: number;
}

/**
 * Subscribe to board changes via Supabase Realtime.
 * No-op when NEXT_PUBLIC_REALTIME_ENABLED is false or Supabase is unconfigured.
 */
export function useBoardRealtime({ onRefresh, debounceMs = 2000 }: Options) {
  const lastFire = useRef(0);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowser>>["channel"]> | null>(null);

  useEffect(() => {
    if (!REALTIME_ENABLED || !SUPABASE_CONFIGURED) return;

    const sb = getSupabaseBrowser();
    if (!sb) return;

    const debouncedRefresh = () => {
      const now = Date.now();
      if (now - lastFire.current < debounceMs) return;
      lastFire.current = now;
      onRefresh();
    };

    let channel: ReturnType<typeof sb.channel> | null = null;
    try {
      channel = sb
        .channel("board-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "metric_snapshots" },
          debouncedRefresh,
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "leaderboards_cached" },
          debouncedRefresh,
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            try {
              sb.removeChannel(channel!);
            } catch {
              // ignore
            }
            channelRef.current = null;
          }
        });
    } catch {
      // WebSocket may be blocked by CSP or unavailable (e.g. insecure context).
      // Fail silently — the board still works via polling/refresh.
      return;
    }

    channelRef.current = channel;

    return () => {
      try {
        sb.removeChannel(channel);
      } catch {
        // ignore cleanup errors
      }
      channelRef.current = null;
    };
  }, [onRefresh, debounceMs]);
}

export { REALTIME_ENABLED };
