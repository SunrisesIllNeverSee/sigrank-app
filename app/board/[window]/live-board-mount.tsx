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
 *   - fetchDetail(codename): WS-4 drill enrichment for the operator dock.
 *     Fetches /api/v1/operators/{codename} (+ /records) and returns the
 *     Partial<LiveOperator> overlay the dock merges over the selected row —
 *     verification/supporter/age/messages are refreshed and `recs` (hall +
 *     metric-board records) is populated. `trend` is deliberately NOT
 *     populated: the history endpoint exposes signa_rate points, which are
 *     legacy vocabulary the workspace contract explicitly does not bind —
 *     a yield-series endpoint is a WS-4 follow-up.
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
import { LiveBoardWorkspace } from "@/components/live/LiveBoardWorkspace";

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

/** /api/v1/operators/{codename} fields the dock overlay consumes. */
interface OperatorApiShape {
  verification_status?: string;
  supporter_tier?: string;
  account_age_days?: number;
  total_messages?: number;
  claimed?: boolean;
}

/** /api/v1/operators/{codename}/records envelope. */
interface RecordsApiShape {
  dynamic_records?: {
    metric?: string;
    metric_name?: string;
    rank?: number;
    value?: string;
    window?: string;
  }[];
  static_records?: {
    title?: string;
    value?: string;
    achieved_at?: string;
  }[];
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

  const loadRemaining = useCallback(async () => {
    if (inFlightRef.current) return;
    const offset = loadedRef.current;
    if (offset >= initial.totalOperators) return; // field already complete
    inFlightRef.current = true;
    try {
      const qs = new URLSearchParams({
        window: windowSlug,
        offset: String(offset),
        limit: String(FIELD_FETCH_LIMIT),
      });
      const res = await fetch(`/api/live-board?${qs}`);
      if (!res.ok) return; // 429/5xx — soft-fail; pagination clicks retry
      const data = (await res.json()) as { operators?: LiveOperator[] };
      const rows = Array.isArray(data.operators) ? data.operators : [];
      loadedRef.current = offset + rows.length;
      if (rows.length) setExtraOps((prev) => mergeByCodename(prev, rows));
    } catch {
      /* network/parse failure — the SSR first page still renders */
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

  /* ---------- WS-4 drill enrichment (records + freshest profile bits) --- */
  const fetchDetail = useCallback(
    async (codename: string): Promise<Partial<LiveOperator> | void> => {
      try {
        const enc = encodeURIComponent(codename);
        const [opRes, recRes] = await Promise.all([
          fetch(`/api/v1/operators/${enc}`),
          fetch(`/api/v1/operators/${enc}/records`),
        ]);
        const detail: Partial<LiveOperator> = {};
        if (opRes.ok) {
          const d = (await opRes.json()) as OperatorApiShape;
          // These already ship in the row; the profile read is fresher than
          // the hourly board ISR so the overlay can't regress them.
          if (typeof d.verification_status === "string")
            detail.verif = d.verification_status;
          if (typeof d.supporter_tier === "string")
            detail.supporter = d.supporter_tier;
          if (typeof d.account_age_days === "number")
            detail.age = d.account_age_days;
          if (typeof d.total_messages === "number")
            detail.msgs = d.total_messages;
          if (typeof d.claimed === "boolean") detail.claimed = d.claimed;
        }
        if (recRes.ok) {
          const r = (await recRes.json()) as RecordsApiShape;
          const dyn = Array.isArray(r.dynamic_records)
            ? r.dynamic_records
            : [];
          const stat = Array.isArray(r.static_records)
            ? r.static_records
            : [];
          detail.recs = [
            ...dyn.map((x) => ({
              metric: String(x.metric_name ?? x.metric ?? "record"),
              rank: Number(x.rank) || 0,
              value: String(x.value ?? "—"),
              window: String(x.window ?? ""),
            })),
            // Curated hall records have no rank — they are singular honors;
            // the dock renders "#{rank} · {value}", so 1 is the honest mark.
            ...stat.map((x) => ({
              metric: String(x.title ?? "hall record"),
              rank: 1,
              value: String(x.value ?? "—"),
              window: String(x.achieved_at ?? "").slice(0, 10),
            })),
          ];
        }
        return detail;
      } catch {
        return; // dock renders the row's SSR fields without the overlay
      }
    },
    [],
  );

  if (legacyOn) return <>{legacy}</>;

  return (
    <LiveBoardWorkspace
      key={merged.meta.window}
      initial={merged}
      fetchMore={fetchMore}
      fetchDetail={fetchDetail}
    />
  );
}
