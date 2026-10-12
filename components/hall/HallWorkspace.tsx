"use client";

/**
 * components/hall/HallWorkspace.tsx — Hall of Signal inside the shared
 * SignalAF workspace shell (approved layout:
 * _workspace/layout-editors/approved/hall-layout.json).
 *
 * Zone map (owner-approved export):
 *   LEFT  (220px) — control surface: VIEW (Metrics/Tokens) · WORKFLOW
 *          (Operator-in-the-loop/Hybrid/Automated → hitl/hybrid/agentic) ·
 *          SCOPE · WINDOW · CLASS · PLATFORM · HALL RULES
 *   STAGE — RecordTicker on top, then the MetricTopTen boards in the
 *          approved dense 3-col grid (HALL-08..13).
 *   RIGHT (260px, CLOSED by default) — record inspector: selected record,
 *          holder mini-profile, actions (profile / compare links). Opens
 *          when a board row is picked; honest empty state otherwise —
 *          no fake modules.
 *
 * Data contract is identical to HallClient: four window buckets prefetched
 * by the ISR page, all filtering client-side through URL params. The
 * Metrics/Tokens view and the workflow filter are additive params
 * (?view=tokens, ?workflow=hitl|hybrid|agentic) — existing
 * scope/window/class/platform params keep their exact semantics.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { LeaderboardRow } from "@/lib/board";
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  CLASS_FILTER,
  type PlatformUI,
} from "@/lib/constants";
import { BOARD_WINDOWS, boardWindowBySlug } from "@/lib/board/windows";
import { DISPLAY_RAW, DISPLAY_METRICS } from "@/lib/identity/canon-ids";
import { sortValue } from "@/lib/analytics/sort-value";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";
import { recordValue } from "@/lib/analytics/record-value";
import { MetricTopTen } from "./MetricTopTen";
import { RecordTicker } from "./RecordTicker";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

/** Op-ratio variant board ids (Y.10–Y.12). */
const OP_RATIO_IDS = new Set(["Y.10", "Y.11", "Y.12"]);

const CASCADE_BOARDS = DISPLAY_METRICS.filter(
  (d) => !OP_RATIO_IDS.has(d.id),
).map((d) => ({ canonId: d.id, sort: d.key }));
const OP_RATIO_BOARDS = DISPLAY_METRICS.filter((d) =>
  OP_RATIO_IDS.has(d.id),
).map((d) => ({ canonId: d.id, sort: d.key }));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({ canonId: d.id, sort: d.key }));

/* Token Throughput — the canonical live-board metric (processed tokens/day
   over the exact snapshot window, lib/board/throughput). Pseudo-canon-id
   "throughput" resolves through recordValue/sortValue at the analytics
   boundary; it is NOT ∑ total tokens. */
const THROUGHPUT_BOARD = { canonId: "throughput", sort: "throughput" };
const TOKEN_BOARDS = [...RAW_BOARDS, THROUGHPUT_BOARD];

const ALL_BOARDS = [...CASCADE_BOARDS, ...OP_RATIO_BOARDS, ...TOKEN_BOARDS];

const DISPLAY_BY_ID: Record<string, (typeof DISPLAY_METRICS)[number]> =
  Object.fromEntries(
    [...DISPLAY_RAW, ...DISPLAY_METRICS].map((d) => [d.id, d]),
  );

function coerce<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}

/** Stored workflow vocabulary → owner-facing control labels. */
const WORKFLOW_OPTS = [
  { id: "hitl", label: "OPERATOR-IN-THE-LOOP" },
  { id: "hybrid", label: "HYBRID" },
  { id: "agentic", label: "AUTOMATED" },
] as const;
type WorkflowSel = (typeof WORKFLOW_OPTS)[number]["id"];

type ViewSel = "metrics" | "tokens";

interface Props {
  /** Active scope: pre-fetched data for all 4 windows (claimed filter). */
  windowsData: Record<string, LeaderboardRow[]>;
  /** All scope: pre-fetched data for all 4 windows. */
  windowsDataAll?: Record<string, LeaderboardRow[]>;
}

interface SelectedRecord {
  row: LeaderboardRow;
  canonId: string;
  metricName: string;
  value: string;
  rank: number;
}

/** Uniform param-writing select (same contract as HallHeader's
 *  FilterSelect — clearValue deletes the param). */
function ParamSelect({
  label,
  param,
  value,
  clearValue,
  options,
  syncKey,
}: {
  label: string;
  param: string;
  value: string;
  clearValue: string;
  options: { value: string; label: string }[];
  /** bump to force a remount when params change externally */
  syncKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === clearValue) params.delete(param);
      else params.set(param, next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams, param, clearValue],
  );
  return (
    <label className="ctl" key={syncKey}>
      <span className="cl">{label}</span>
      <select
        aria-label={`${label} filter`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function HallWorkspace({ windowsData, windowsDataAll }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const classParam = (mounted ? sp.get("class") : null) ?? "all";
  const platformParam = mounted ? sp.get("platform") : null;
  const windowParam = (mounted ? sp.get("window") : null) ?? "all";
  const scopeParam = (mounted ? sp.get("scope") : null) ?? "active";
  const viewParam = (mounted ? sp.get("view") : null) ?? "metrics";
  const workflowParam = (mounted ? sp.get("workflow") : null) ?? "hybrid";

  const platform = coerce<PlatformUI>(platformParam, PLATFORM_UI, PLATFORM_DEFAULT);
  const win = boardWindowBySlug(windowParam) ?? boardWindowBySlug("all")!;
  const scope = scopeParam === "all" ? "all" : "active";
  const view: ViewSel = viewParam === "tokens" ? "tokens" : "metrics";
  const workflow: WorkflowSel = coerce(
    workflowParam,
    WORKFLOW_OPTS.map((w) => w.id) as readonly WorkflowSel[],
    "hybrid",
  );

  const setParam = useCallback(
    (param: string, next: string, clearValue: string) => {
      const params = new URLSearchParams(sp.toString());
      if (next === clearValue) params.delete(param);
      else params.set(param, next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, sp],
  );

  /* ---------- filtering — identical to HallClient plus workflow ---------- */
  const baseRows = useMemo(() => {
    const source =
      scope === "all" && windowsDataAll
        ? (windowsDataAll[win.slug] ?? [])
        : (windowsData[win.slug] ?? []);
    let rows: LeaderboardRow[] = source.filter(
      (r) => r.operator.status !== "retired",
    );
    if (scope === "active") rows = rows.filter((r) => r.operator.claimed);
    if (platform !== PLATFORM_DEFAULT) {
      const domain = platform.toLowerCase();
      rows = rows.filter(
        (r) => r.operator.primary_domain?.toLowerCase() === domain,
      );
    }
    if (classParam !== "all") {
      rows = rows.filter(
        (r) =>
          r.snapshot.class_tier?.toLowerCase() === classParam.toLowerCase(),
      );
    }
    // Workflow view semantics mirror the live board exactly:
    // HYBRID is the combined/default field view (resolved HITL + resolved
    // agentic + unresolved/legacy rows). The other two modes narrow the field.
    // Stored workflow_mode evidence remains untouched.
    if (workflow === "hitl" || workflow === "agentic") {
      rows = rows.filter((r) => r.workflow_mode === workflow);
    }
    return rows;
  }, [
    windowsData,
    windowsDataAll,
    win.slug,
    platform,
    classParam,
    scope,
    workflow,
  ]);

  /* ---------- sorted boards ---------- */
  const metricRows = useMemo(
    () =>
      ALL_BOARDS.map((b) =>
        [...baseRows]
          .sort((a, z) => sortValue(z, b.sort) - sortValue(a, b.sort))
          .slice(0, 10)
          .map((r, i) => ({ ...r, global_rank: i + 1 })),
      ),
    [baseRows],
  );

  const tickerItems = useMemo(
    () =>
      ALL_BOARDS.map((b, i) => {
        const top = metricRows[i]?.[0];
        if (!top) return null;
        const v = recordValue(top, b.canonId);
        if (v === "—") return null;
        return {
          board:
            b.canonId === "throughput"
              ? "THPT"
              : (DISPLAY_BY_ID[b.canonId]?.ticker ?? b.canonId),
          holder: top.operator.display_name || top.operator.codename,
          value: v,
          href: `/user/${top.operator.codename}`,
          outlier: isOutlierRow(top),
        };
      }).filter((x): x is NonNullable<typeof x> => x !== null),
    [metricRows],
  );

  /* ---------- inspector selection ---------- */
  const [sel, setSel] = useState<SelectedRecord | null>(null);
  const [inspectorSignal, setInspectorSignal] = useState(0);
  const onSelect = useCallback((row: LeaderboardRow, canonId: string) => {
    const boardRows = metricRows[ALL_BOARDS.findIndex((b) => b.canonId === canonId)];
    setSel({
      row,
      canonId,
      metricName:
        canonId === "throughput"
          ? "Token Throughput"
          : (DISPLAY_BY_ID[canonId]?.name ?? canonId),
      value: recordValue(row, canonId),
      rank: (boardRows?.findIndex(
        (r) => r.operator.operator_id === row.operator.operator_id,
      ) ?? -1) + 1,
    });
    setInspectorSignal((n) => n + 1);
  }, [metricRows]);

  const boardSet =
    view === "metrics" ? [...CASCADE_BOARDS, ...OP_RATIO_BOARDS] : TOKEN_BOARDS;
  const boardOffset = view === "metrics" ? 0 : CASCADE_BOARDS.length + OP_RATIO_BOARDS.length;

  /* ---------- left panel — control surface ---------- */
  const left = (
    <>
      <div className="mod">
        <div className="mini-h"><span className="sq"></span>VIEW</div>
        <div className="ws-seg" role="group" aria-label="Hall view">
          <button
            type="button"
            className={view === "metrics" ? "on" : ""}
            onClick={() => setParam("view", "metrics", "metrics")}
          >
            METRICS
          </button>
          <button
            type="button"
            className={view === "tokens" ? "on" : ""}
            onClick={() => setParam("view", "tokens", "metrics")}
          >
            TOKENS
          </button>
        </div>
        <p className="ws-note" style={{ marginTop: 8 }}>
          {view === "metrics"
            ? "Cascade + operating-ratio records (Υ · SNR · LEV · VEL · 10xDEV …)"
            : "Raw token records — pillars + token throughput (tok/day)"}
        </p>
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>WORKFLOW</div>
        <div className="ws-seg" style={{ flexDirection: "column" }} role="group" aria-label="Workflow filter">
          {WORKFLOW_OPTS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={workflow === w.id ? "on" : ""}
              onClick={() => setParam("workflow", w.id, "hybrid")}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>SCOPE</div>
        <div className="ws-seg" role="group" aria-label="Scope">
          <button
            type="button"
            className={scope === "active" ? "on" : ""}
            onClick={() => setParam("scope", "active", "active")}
          >
            ACTIVE
          </button>
          <button
            type="button"
            className={scope === "all" ? "on" : ""}
            onClick={() => setParam("scope", "all", "active")}
          >
            ALL
          </button>
        </div>
        <p className="ws-note" style={{ marginTop: 8 }}>
          {scope === "active"
            ? "Verified operators with real submissions"
            : "Full field including seeded data"}
        </p>
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>FILTERS</div>
        <div className="ws-ctl">
          <ParamSelect
            label="WINDOW"
            param="window"
            value={win.slug}
            clearValue="all"
            options={BOARD_WINDOWS.map((w) => ({ value: w.slug, label: w.label }))}
          />
          <ParamSelect
            label="CLASS"
            param="class"
            value={classParam}
            clearValue="all"
            options={CLASS_FILTER.map((c) => ({ value: c.id, label: c.label }))}
          />
          <ParamSelect
            label="PLATFORM"
            param="platform"
            value={platform}
            clearValue={PLATFORM_DEFAULT}
            options={PLATFORM_UI.map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>HALL RULES</div>
        <p className="ws-note">
          The Hall of Signal is the permanent record of peak operator
          performance. Where the leaderboard shows the current field, the Hall
          preserves the all-time best. <b>Entries are immutable once
          recorded.</b> Class tiers are set by yield thresholds, not raw
          output — the Hall rewards efficiency architecture over brute-force
          token production.
        </p>
      </div>
    </>
  );

  /* ---------- right panel — record inspector (closed by default) ---------- */
  const selOp = sel?.row;
  const selReal = selOp ? selOp.operator.isPlaceholder === false : false;
  const right = (
    <>
      <div className="mod">
        <div className="mini-h"><span className="sq"></span>SELECTED RECORD</div>
        {sel ? (
          <div className="ws-kv">
            <div className="row"><span className="k">metric</span><span className="v acc">{sel.metricName}</span></div>
            <div className="row"><span className="k">canon</span><span className="v">{sel.canonId === "throughput" ? "THPT" : sel.canonId}</span></div>
            <div className="row"><span className="k">rank</span><span className="v">#{sel.rank || "—"}</span></div>
            <div className="row"><span className="k">value</span><span className="v acc">{sel.value}</span></div>
            <div className="row"><span className="k">window</span><span className="v">{win.label}</span></div>
            <div className="row"><span className="k">scope</span><span className="v">{scope}</span></div>
          </div>
        ) : (
          <div className="ws-empty">
            <span className="gi">◇</span>
            <span>NO RECORD SELECTED<br />pick a row on any board</span>
          </div>
        )}
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>HOLDER</div>
        {selOp ? (
          <div className="ws-kv">
            <div className="row"><span className="k">operator</span><span className="v">{selOp.operator.display_name || selOp.operator.codename}</span></div>
            <div className="row"><span className="k">class</span><span className="v">{selOp.snapshot.class_tier ?? "—"}</span></div>
            <div className="row"><span className="k">platform</span><span className="v">{selOp.operator.primary_domain ?? "—"}</span></div>
            <div className="row"><span className="k">workflow</span><span className="v">{selOp.workflow_mode ?? "—"}</span></div>
            <div className="row"><span className="k">status</span><span className="v">{selOp.operator.claimed ? "CLAIMED" : "SEED"}</span></div>
          </div>
        ) : (
          <div className="ws-empty"><span className="gi">◍</span><span>—</span></div>
        )}
      </div>

      <div className="mod">
        <div className="mini-h"><span className="sq"></span>ACTIONS</div>
        {selOp && selReal ? (
          <div className="ws-ctl">
            <a className="ws-note" style={{ color: "var(--ac)" }} href={`/user/${selOp.operator.codename}`}>
              VIEW OPERATOR →
            </a>
            <a className="ws-note" style={{ color: "var(--ac)" }} href={`/compare?a=${encodeURIComponent(selOp.operator.codename)}`}>
              COMPARE THIS OPERATOR →
            </a>
          </div>
        ) : selOp ? (
          <p className="ws-note">Seed operator — no live profile.</p>
        ) : (
          <p className="ws-note">Select a record row to act on it.</p>
        )}
      </div>
    </>
  );

  return (
    <WorkspaceShell
      active="hall"
      title="HALL OF SIGNAL"
      leftTitle="HALL OF SIGNAL"
      left={left}
      rightTitle="RECORD"
      right={right}
      leftWidth={220}
      rightWidth={260}
      rightDefaultOpen={false}
      rightOpenSignal={inspectorSignal}
      status={
        <>
          {baseRows.length} OPERATORS · {view === "metrics" ? "METRICS" : "TOKENS"} VIEW ·{" "}
          {workflow === "hybrid" ? "HYBRID · COMBINED FIELD" : workflow.toUpperCase()} ·{" "}
          {win.label.toUpperCase()} · SIGNALAF × SIGRANK · MO§ES™
        </>
      }
    >
      <div className="ws-ticker">
        <RecordTicker items={tickerItems} />
      </div>
      <div className="ws-grid3">
        {boardSet.map((b, i) => (
          <MetricTopTen
            key={b.canonId}
            canonId={b.canonId}
            rows={metricRows[boardOffset + i]}
            name={b.canonId === "throughput" ? "Token Throughput" : undefined}
            ticker={b.canonId === "throughput" ? "THPT · TOK/DAY" : undefined}
            onSelect={onSelect}
            selectedId={sel?.row.operator.operator_id ?? null}
          />
        ))}
      </div>
    </WorkspaceShell>
  );
}

export default HallWorkspace;
