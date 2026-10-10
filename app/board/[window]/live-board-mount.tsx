"use client";

/**
 * app/board/[window]/live-board-mount.tsx — the client mount for the frozen
 * live-board workspace (components/live/*, tag reference-v1) on
 * /board/[window]. Route-local module (not routable); colocated so the 2B
 * cutover stays inside app/board/.
 *
 * Phase-2B WS-3 wiring (PHASE2B_IMPLEMENTATION_PLAN.md):
 *
 *   - SSR ships the first page of the ranked field (initial.operators —
 *     LIVE_PAGE_SIZE rows from lib/board/live-projection). On mount this
 *     wrapper fetches the REST of the field from /api/live-board so the
 *     workspace's sort/filter/search run over the complete live scope —
 *     reference-v1 semantics. Hydrated rows re-enter the workspace through
 *     an augmented `initial` prop (its `ops` memo is keyed on
 *     initial.operators), never through a client-side re-map.
 *
 *   - fetchMore(page): the workspace calls this from its pagination chrome.
 *     It triggers the same remaining-field fetch (cursor = delivered row
 *     count) and resolves void — rows arrive via the augmented `initial`
 *     prop instead of the workspace's internal append buffer, so the two
 *     channels can never double-append. Works as the retry path when the
 *     mount fetch soft-failed (429/offline).
 *
 *   - fieldStatus: the hydration lifecycle ("idle" | "loading" | "ready" |
 *     "error") surfaced to the workspace so the pagination chrome can show
 *     SYNCING/FAILURE state — a soft-fail never blanks the SSR'd first page.
 *
 *   - fetchDetail: not overridden — the workspace's default
 *     createDetailFetcher(meta.window) (components/live/enrich.ts) fans out
 *     profile + history + records + snapshot-history per selection with a
 *     session-level in-flight cache, binds signa_rate points to the compact
 *     trend sparkline (honestly labeled SCORE HISTORY · SIGNA RATE in the
 *     dock), and renders the signed snapshot ledger for claimed operators.
 *
 *   - ?v=legacy A/B flag: post-mount read of location.search swaps the
 *     workspace for the pre-2B board surface (passed in as the `legacy`
 *     prop). Client-side on purpose: the page never touches searchParams,
 *     so /board/* stays static + ISR-cacheable (the 2026-07-02 constraint).
 *     SSR always emits the workspace; flagged sessions swap after hydration.
 *
 * Live denominator: initial.totalOperators / population.count are projected
 * server-side from the full ranking scope — nothing here is a constant.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  LiveBoardInitialState,
  LiveOperator,
} from "@/lib/board/live-types";
import {
  LiveBoardWorkspace,
  type LiveFieldStatus,
} from "@/components/live/LiveBoardWorkspace";

/** /api/live-board row ceiling per request — same 2,000 cap as the public API. */
const FIELD_FETCH_LIMIT = 2000;

interface LiveBoardMountProps {
  /** SSR payload from getLiveBoardInitialState (first page + full-scope aggregates). */
  initial: LiveBoardInitialState;
  /** Route slug (7d|30d|90d|all) — the /api/live-board window param. */
  windowSlug: string;
  /** Pre-2B board subtree, rendered only under ?v=legacy (A/B soak). */
  legacy?: ReactNode;
}

/** Append only rows whose codename isn't already loaded (StrictMode-safe). */
function mergeByCodename(
  prev: LiveOperator[],
  rows: LiveOperator[],
): LiveOperator[] {
  const seen = new Set(prev.map((o) => o.codename));
  const add = rows.filter((o) => !seen.has(o.codename));
  return add.length ? [...prev, ...add] : prev;
}

export function LiveBoardMount({
  initial,
  windowSlug,
  legacy,
}: LiveBoardMountProps) {
  /* ---------- ?v=legacy review flag (post-mount; keeps the page static) -- */
  const [legacyOn, setLegacyOn] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("v") === "legacy") {
      setLegacyOn(true);
    }
  }, []);

  /* ---------- full-field hydration (WS-3) ------------------------------- */
  const [extraOps, setExtraOps] = useState<LiveOperator[]>([]);
  /** Rows already delivered server+client side — the pagination cursor. */
  const loadedRef = useRef(initial.operators.length);
  const inFlightRef = useRef(false);
  /* Hydration lifecycle for the pagination chrome — a 429/network soft-fail
     lands as "error" (retryable via fetchMore/page clicks); a short or
     zero-row response with the field still incomplete is also "error" rather
     than a silent stall. */
  const [fieldStatus, setFieldStatus] = useState<LiveFieldStatus>(() =>
    initial.operators.length >= initial.totalOperators ? "ready" : "idle",
  );

  const loadRemaining = useCallback(async () => {
    if (inFlightRef.current) return;
    const offset = loadedRef.current;
    if (offset >= initial.totalOperators) {
      setFieldStatus("ready");
      return;
    }
    inFlightRef.current = true;
    setFieldStatus("loading");
    try {
      const qs = new URLSearchParams({
        window: windowSlug,
        offset: String(offset),
        limit: String(FIELD_FETCH_LIMIT),
      });
      const res = await fetch(`/api/live-board?${qs}`);
      if (!res.ok) {
        // 429/5xx — soft-fail; pagination clicks retry via fetchMore
        setFieldStatus("error");
        return;
      }
      const data = (await res.json()) as { operators?: LiveOperator[] };
      const rows = Array.isArray(data.operators) ? data.operators : [];
      loadedRef.current = offset + rows.length;
      if (rows.length) setExtraOps((prev) => mergeByCodename(prev, rows));
      setFieldStatus(
        loadedRef.current >= initial.totalOperators ? "ready" : "error",
      );
    } catch {
      /* network/parse failure — the SSR first page still renders */
      setFieldStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, [windowSlug, initial.totalOperators]);

  // Hydrate the remaining field on mount (single flight; in-flight guard
  // absorbs StrictMode's double-effect in dev).
  useEffect(() => {
    void loadRemaining();
  }, [loadRemaining]);

  // Re-feed the workspace via the `initial` prop — its `ops` memo is keyed
  // on initial.operators, so the augmented payload grows the field without
  // touching workspace internals. Dedupe by codename: hydration can never
  // introduce a row the SSR page already rendered.
  const merged = useMemo(() => {
    if (!extraOps.length) return initial;
    const seen = new Set(initial.operators.map((o) => o.codename));
    const add = extraOps.filter((o) => !seen.has(o.codename));
    return add.length
      ? { ...initial, operators: [...initial.operators, ...add] }
      : initial;
  }, [initial, extraOps]);

  const fetchMore = useCallback(async (): Promise<LiveOperator[] | void> => {
    await loadRemaining();
  }, [loadRemaining]);

  if (legacyOn) return <>{legacy}</>;

  return (
    <LiveBoardWorkspace
      key={merged.meta.window}
      initial={merged}
      fetchMore={fetchMore}
      fieldStatus={fieldStatus}
    />
  );
}
