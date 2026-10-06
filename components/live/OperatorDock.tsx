"use client";

/**
 * components/live/OperatorDock.tsx — the selected-operator drill surface.
 *
 * Ports board.js LB-03/04/05 (`renderFeat`, `renderPmod`, `radar`,
 * `renderSharePrev`) as JSX. On top of the reference markup it carries the
 * Phase-2B drill column — a mono tab strip inside the .feat card with the
 * seven selected-operator sections from the contract (DATA_KEYS §11):
 *   OVERVIEW · CASCADE · ACTIVITY · TOOLS · HISTORY · RECORDS · SHARE
 * OVERVIEW reproduces the reference left pane verbatim; the other tabs
 * surface fields already present on LiveOperator, overlaid with the WS-4
 * enrichment payload — no fabricated data; absent values render "—".
 *
 * Enrichment wiring (WS-4/2C): the WORKSPACE owns the fetch lifecycle (one
 * session-cached fan-out per selected codename via enrich.ts) and hands the
 * dock `detail` + `detailStatus`; the base LiveOperator it renders is already
 * merged (mergeDetail) so verif/supporter/trend/recs reach every surface —
 * the rail profile tile and the row's trend sparkline included. Failure never
 * blanks the card: a failed channel leaves base field data visible and marks
 * only its own surface via `detail.errors`.
 *
 * Verification mark: gated on real `verification_status` (verified/audited),
 * never unconditional — the reference's @-handle heuristic is retired here.
 *
 * Radar divergence (owner 2026-10-06): the .feat-r chart is the compare-page
 * dual-overlapping radar — the operator polygon over a baseline series
 * (default FIELD MAX rim; overridable via `radarBaseline`) — not the
 * reference's single polygon.
 */
import Image from "next/image";
import { useRef, useState } from "react";
import type {
  LiveOperator,
  LivePopulation,
} from "@/lib/board/live-types";
import {
  COPY,
  RADAR_AXES,
  deltaBody,
  deltaUp,
  isVerifiedOp,
  mvLabel,
  type ProfileView,
} from "./utils";
import type { DetailStatus, LiveOperatorDetail } from "./enrich";
import { DRILL_CAPS } from "./enrich";
import { PixelBadge } from "./PixelBadge";
import { Sparkline } from "./rows";
/* dock-radar.css — the dual-radar chrome (owner directive 2026-10-06);
   travels with this module the way rail-extras.css rides EnterprisePromo. */
import "./dock-radar.css";

export type DockTab =
  | "overview"
  | "cascade"
  | "activity"
  | "tools"
  | "history"
  | "records"
  | "share";

const DOCK_TABS: { id: DockTab; label: string }[] = [
  { id: "overview", label: "OVERVIEW" },
  { id: "cascade", label: "CASCADE" },
  { id: "activity", label: "ACTIVITY" },
  { id: "tools", label: "TOOLS" },
  { id: "history", label: "HISTORY" },
  { id: "records", label: "RECORDS" },
  { id: "share", label: "SHARE" },
];

/* ---------- dual radar (owner 2026-10-06 — the compare-page dual-overlapping
   radar replaces the profile single polygon; ring/spoke/label geometry stays
   the reference radar()'s). The baseline layer is a second polygon drawn
   UNDER the operator series, compare-page layering (CascadeRadar: reference
   series behind, solid series on top).

   Baseline sourcing — nothing beyond `d`/`population`/`detail` reaches this
   component, so the featured-#1 radar and a true field median are both
   unwirable today. The DEFAULT baseline is therefore the FIELD MAX rim:
   `d.series` is already normalized 0..1 against initial.fieldMax (opRadar),
   so radius 1 on every axis IS the per-axis field ceiling — the same
   [1,1,1,1,1] shape live.js emits for the field leader. A real baseline
   (featured-#1 opRadar() output, a field median) wires in later via the
   optional `radarBaseline` prop — pre-normalized, RADAR_AXES order. ---------- */
export interface DockRadarBaseline {
  /** Legend chip text — "FIELD MAX" or a baseline operator's name. */
  label: string;
  /** Pre-normalized 0..1 per axis, RADAR_AXES order — same scale as
   *  ProfileView.series (clamped defensively at render). */
  vals: number[];
}

/** The rim polygon — per-axis field maximum under opRadar normalization. */
export const FIELD_MAX_RADAR: DockRadarBaseline = {
  label: "FIELD MAX",
  vals: RADAR_AXES.map(() => 1),
};

export function RadarChart({
  vals,
  baseline,
  size = 190,
}: {
  vals: number[];
  baseline?: DockRadarBaseline;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;
  const N = vals.length;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const pt = (i: number, r: number): readonly [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R];
  };
  const poly = (rr: number) => vals.map((_, i) => pt(i, rr).join(",")).join(" ");
  const ptsFor = (vs: readonly number[]) =>
    vs.map((v, i) => pt(i, clamp01(v)).join(",")).join(" ");
  /* positional align: pad/truncate the baseline to the operator axis count */
  const base = baseline
    ? vals.map((_, i) => clamp01(baseline.vals[i] ?? 0))
    : null;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* dotted rings — reference radii kept; dashes mark them as grid so the
          solid series strokes read as data, not chrome */}
      {[0.33, 0.66, 1].map((r) => (
        <polygon
          key={r}
          points={poly(r)}
          fill="none"
          stroke="var(--line2)"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ))}
      {vals.map((_, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1.22);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line2)" />
            <text
              x={lx}
              y={ly}
              fill="var(--mut)"
              fontSize={8.5}
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {RADAR_AXES[i].toUpperCase()}
            </text>
          </g>
        );
      })}
      {/* baseline under the operator — contrast --cyan stroke + lighter fill */}
      {base && (
        <>
          <polygon
            points={ptsFor(base)}
            fill="color-mix(in srgb, var(--cyan) 8%, transparent)"
            stroke="var(--cyan)"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          {base.map((v, i) => {
            const [x, y] = pt(i, v);
            return <circle key={i} cx={x} cy={y} r={2} fill="var(--cyan)" />;
          })}
        </>
      )}
      <polygon
        points={ptsFor(vals)}
        fill="color-mix(in srgb, var(--ac) 22%, transparent)"
        stroke="var(--ac)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {vals.map((v, i) => {
        const [x, y] = pt(i, clamp01(v));
        return <circle key={i} cx={x} cy={y} r={2.6} fill="var(--ac)" />;
      })}
    </svg>
  );
}

/* ---------- share preview (board.js renderSharePrev) ----------
   GENERATE SHARE CARD → /s/<codename> (canonical share URL, OPEN-10). */
export function SharePreview({
  d,
  population,
}: {
  d: ProfileView;
  population: LivePopulation;
}) {
  const pop = population.count || 1;
  const pct = Math.max(0.1, +((d.rank / pop) * 100).toFixed(1));
  const slug = encodeURIComponent(d.op?.slug ?? d.codename);
  return (
    <div className="shareprev">
      {/* brand mark PNG from the SignalAF asset pack (66x60, ~300B) —
          pixelated rendering keeps the block edges hard. */}
      <Image
        className="sharemark"
        src="/live/signalaf-mark.png"
        alt="SignalAF mark"
        width={66}
        height={60}
        unoptimized
      />
      <div className="big">
        TOP <em>{pct}%</em> OF AI OPERATORS
      </div>
      <div className="rk mono">
        SIGNAL RANK #{d.rank} / {pop.toLocaleString()}
      </div>
      <div className="mono mut" style={{ fontSize: 9, margin: "2px 0 8px" }}>
        {d.name} · {population.tag}
      </div>
      <a className="btn ghost" href={`/s/${slug}`}>
        GENERATE SHARE CARD
      </a>
    </div>
  );
}

/* ---------- compact profile tile (board.js renderPmod) ---------- */
export function OperatorProfileTile({ d }: { d: ProfileView }) {
  return (
    <div className="pmod-host">
      <div className="pmod">
        <span className="av">
          {d.op?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               operator avatar URL; 38px fixed tile */
            <img src={d.op.avatarUrl} alt="" loading="lazy" />
          ) : (
            d.name[0]
          )}
          {isVerifiedOp(d.verif) ? (
            <span className="avbd">
              <PixelBadge name="verified" />
            </span>
          ) : null}
        </span>
        <div>
          <div className="pn">
            {d.name} {isVerifiedOp(d.verif) && <span className="vchk">✓</span>}
          </div>
          <div className="ph">
            {d.handle.startsWith("@") ? d.handle : d.codename} · #{d.rank}
          </div>
        </div>
        <div className="py">
          <div className="n">{d.y}</div>
          <div className="l">YIELD Υ</div>
        </div>
      </div>
      <div className="pmod-tags">
        <span className="tag rank">#{d.rank} GLOBAL</span>
        <span className="tag">{d.klass}</span>
        <span className="tag arch">{d.arch}</span>
      </div>
    </div>
  );
}

/* ---------- drill tab bodies ---------- */
const dash = (v: string | number | null | undefined): string | number =>
  v === null || v === undefined || v === "" ? "—" : v;

function StatCells({ cells }: { cells: [string, string | number][] }) {
  return (
    <div className="fgrid">
      {cells.map(([l, v]) => (
        <div className="fcell" key={l}>
          <div className="n">{v}</div>
          <div className="l">{l}</div>
        </div>
      ))}
    </div>
  );
}

function DrillRows({
  rows,
}: {
  rows: [label: string, value: string | number, extra?: string | number][];
}) {
  return (
    <div className="srows" style={{ marginTop: 0 }}>
      {rows.map(([l, v, extra], k) => (
        <div className="srow" key={k}>
          <span className="sl2">{l}</span>
          {extra !== undefined && (
            <span className="mono mut" style={{ fontSize: 9 }}>
              {extra}
            </span>
          )}
          <span className="sv2">{v}</span>
        </div>
      ))}
    </div>
  );
}

function CascadeTab({ o }: { o: LiveOperator }) {
  const nc = o.nc;
  return (
    <StatCells
      cells={[
        ["YIELD Υ", nc ? "—" : o.yield],
        ["LEVERAGE", nc ? "—" : o.lev],
        ["VELOCITY", nc ? "—" : o.vel],
        ["SNR", nc ? "—" : o.snr],
        ["10XDEV", nc ? "—" : o.dev],
        ["SCALE V", nc ? "—" : dash(o.scalev)],
        ["EFFICIENCY", nc ? "—" : dash(o.eff)],
        ["OP RATIO", nc ? "—" : dash(o.opratio)],
      ]}
    />
  );
}

function ActivityTab({ o }: { o: LiveOperator }) {
  return (
    <div className="drill">
      <Sparkline arr={o.trend ?? []} w={220} h={48} />
      <DrillRows
        rows={[
          ["MOVEMENT · 7D", mvLabel(o.mv7)],
          ["MOVEMENT · 24H", mvLabel(o.mv24)],
          ["THROUGHPUT · PROMPTS/D", dash(o.ptpd)],
          ["THROUGHPUT · OUTPUT/D", dash(o.otpd)],
          ["LAST SNAPSHOT", dash(o.last)],
        ]}
      />
    </div>
  );
}

function ToolsTab({ o }: { o: LiveOperator }) {
  return (
    <div className="drill">
      <DrillRows
        rows={[
          ["PLATFORM", dash(o.platform)],
          ["WORKFLOW MODE", o.wf ? o.wf.toUpperCase() : "—"],
          ["VERIFICATION", dash(o.verif)],
          ["SUPPORTER", dash(o.supporter)],
          ["CLAIMED", o.claimed ? "YES" : "NO"],
        ]}
      />
      <p className="drill-note">
        TOOL · MODEL · MCP BREAKDOWN — no public projection yet (DATA_KEYS §11:
        tool usage is measured locally; the workspace shows the account
        context the API does expose).
      </p>
    </div>
  );
}

function HistoryTab({
  o,
  detail,
  status,
}: {
  /** null when the featured card didn't resolve to a field row — detail
   *  surfaces (trend/trajectory/ledger) still render from the API payload. */
  o: LiveOperator | null;
  detail: LiveOperatorDetail | null;
  status: DetailStatus;
}) {
  const hist = detail?.history ?? [];
  const snaps = detail?.snapshots ?? [];
  const trend = detail?.trend ?? o?.trend ?? [];
  return (
    <div className="drill">
      <Sparkline arr={trend} w={220} h={48} />
      <p className="drill-note">
        {detail?.trendKind === "score"
          ? "SCORE HISTORY · SIGNA RATE"
          : "YIELD HISTORY · Υ"}{" "}
        · {trend.length} PTS
        {detail?.errors?.history ? " — SYNC FAILED" : ""}
      </p>
      {o && (
        <DrillRows
          rows={[
            ["ACCOUNT AGE", `${o.age}d`],
            ["MESSAGES", o.msgs.toLocaleString()],
            ["∑ OBSERVED", o.total],
            ["PERCENTILE", `${o.pct}`],
            ["LAST SNAPSHOT", dash(o.last)],
          ]}
        />
      )}
      {hist.length > 0 && (
        <>
          <p className="drill-note">RANK TRAJECTORY · {hist.length} SNAPSHOTS</p>
          <DrillRows
            rows={hist
              .slice(-DRILL_CAPS.HISTORY_ROWS)
              .reverse()
              .map((p) => [
                p.date,
                `#${p.rank}`,
                p.klass || undefined,
              ])}
          />
        </>
      )}
      {detail?.snapshotEligible === true && (
        <>
          <p className="drill-note">SIGNED SNAPSHOT LEDGER</p>
          {detail.errors?.snapshots ? (
            <p className="drill-note">— SNAPSHOT LEDGER SYNC FAILED</p>
          ) : snaps.length ? (
            <DrillRows
              rows={snaps.slice(0, DRILL_CAPS.SNAPSHOT_ROWS).map((s) => [
                s.submittedAt.slice(0, 10),
                s.yield_ == null ? "—" : trimYield(s.yield_),
                s.platform,
              ])}
            />
          ) : (
            <p className="drill-note">— NO SCORED SUBMISSIONS</p>
          )}
        </>
      )}
      {detail && detail.snapshotEligible === false && (
        <p className="drill-note">
          SNAPSHOT LEDGER — CLAIMED OPERATORS ONLY
        </p>
      )}
      {detail == null && status === "loading" && (
        <p className="drill-note">⟳ SYNCING HISTORY…</p>
      )}
      {detail == null && status === "error" && (
        <p className="drill-note">— HISTORY UNAVAILABLE · FIELD VALUES SHOWN</p>
      )}
    </div>
  );
}

/** Trim a snapshot-ledger yield to the compact board form. */
function trimYield(v: number): string {
  return v >= 1000 ? `${Math.round(v).toLocaleString("en-US")}` : v.toFixed(2);
}

function RecordsTab({
  recs,
  detail,
  status,
}: {
  /** dynamic metric records — enriched `detail.recs` preferred, else the
   *  base row's (empty by design until WS-4 lands). */
  recs: LiveOperator["recs"] | undefined;
  detail: LiveOperatorDetail | null;
  status: DetailStatus;
}) {
  const dyn = recs ?? [];
  const stat = detail?.recordsStatic ?? [];
  if (!dyn.length && !stat.length) {
    if (detail?.errors?.records)
      return <p className="drill-note">— RECORDS SYNC FAILED</p>;
    if (detail == null && status === "loading")
      return <p className="drill-note">⟳ SYNCING RECORDS…</p>;
    if (detail == null && status === "error")
      return <p className="drill-note">— RECORDS UNAVAILABLE</p>;
    return <p className="drill-note">— NO RECORDS IN THIS SCOPE</p>;
  }
  return (
    <div className="srows" style={{ marginTop: 0 }}>
      {dyn.map((r, k) => (
        <div className="srow" key={`d${k}`}>
          <span className="sl2">{r.metric.toUpperCase()}</span>
          <span className="mono mut" style={{ fontSize: 9 }}>
            {r.window.toUpperCase()}
          </span>
          <span className="sv2">
            #{r.rank} · {r.value}
          </span>
        </div>
      ))}
      {stat.map((r, k) => (
        <div className="srow" key={`s${k}`}>
          <span className="sl2">{r.title.toUpperCase()}</span>
          <span className="mono mut" style={{ fontSize: 9 }}>
            {`HALL${r.date ? ` · ${r.date.slice(0, 10)}` : ""}`}
          </span>
          <span className="sv2">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- the dock card (board.js .feat + renderFeat) ---------- */
export function OperatorDock({
  d,
  docked,
  onToggleDock,
  population,
  detail = null,
  detailStatus = "idle",
  radarBaseline,
}: {
  d: ProfileView;
  /** true → this card renders hidden; profile lives in the rail module. */
  docked: boolean;
  onToggleDock: () => void;
  population: LivePopulation;
  /** WS-4 enriched detail for the selected operator (null while loading /
   *  on total failure). LiveOperator-shaped fields are already merged into
   *  `d.op`; the detail object additionally carries history points, static
   *  records, the claimed-only snapshot ledger, and per-channel errors. */
  detail?: LiveOperatorDetail | null;
  detailStatus?: DetailStatus;
  /** Dual-radar baseline overlay (owner 2026-10-06 — the compare-page dual
   *  radar replaces the profile single). Pre-normalized 0..1 in RADAR_AXES
   *  order on the same fieldMax scale as `d.series` — wire the featured/#1
   *  operator's opRadar() output or a field median here. Optional: absent =
   *  FIELD MAX rim (radius 1 is the per-axis ceiling `d.series` is already
   *  normalized against — the honest field baseline with no new data flow). */
  radarBaseline?: DockRadarBaseline;
}) {
  const [tab, setTab] = useState<DockTab>("overview");
  /* Roving-tabindex tab strip (WAI-ARIA tabs pattern — the reference shipped
     the strip as visual chrome; the port adds the keyboard contract):
     Arrow keys move selection, Home/End jump to the ends. */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = DOCK_TABS.findIndex((t) => t.id === tab);
    if (idx < 0) return;
    let next: number;
    if (e.key === "ArrowRight") next = (idx + 1) % DOCK_TABS.length;
    else if (e.key === "ArrowLeft")
      next = (idx - 1 + DOCK_TABS.length) % DOCK_TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = DOCK_TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(DOCK_TABS[next].id);
    tabRefs.current[next]?.focus();
  };
  /* `d.op` is already the enriched merge — the workspace overlays detail
     onto the ops row before profileFor runs, so base fields never blank. */
  const o = d.op;
  /* Dual-radar baseline — the prop (featured-#1 / field-median series, when
     the workspace wires it) wins; else the FIELD MAX rim, the honest ceiling
     `d.series` is already normalized against (owner 2026-10-06). */
  const radarBase = radarBaseline ?? FIELD_MAX_RADAR;

  const dirUp = deltaUp(d.delta);
  return (
    <section
      className="feat"
      style={docked ? { display: "none" } : undefined}
      aria-label="Selected operator"
      /* reference-v1 has no keyboard model; Escape docks the card into the
         rail — the same action the ⇄ TO RAIL button performs. */
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onToggleDock();
        }
      }}
    >
      <button
        className="dockbtn"
        title="dock into right rail"
        onClick={onToggleDock}
      >
        ⇄ TO RAIL
      </button>
      <div className="feat-l">
        <div
          className="docktabs"
          role="tablist"
          aria-label="Operator sections"
          onKeyDown={onTabKeyDown}
        >
          {DOCK_TABS.map((t, i) => (
            <button
              key={t.id}
              id={`lbw-docktab-${t.id}`}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="lbw-dockpanel"
              tabIndex={tab === t.id ? 0 : -1}
              className={tab === t.id ? "on" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {detailStatus === "loading" && (
          <p className="drill-note" role="status">
            ⟳ OPERATOR DETAIL — SYNCING
          </p>
        )}
        {detailStatus === "error" && (
          <p className="drill-note" role="status">
            — DETAIL SYNC UNAVAILABLE · FIELD VALUES SHOWN
          </p>
        )}
        {/* one shared panel element — every tab's aria-controls resolves to
            it; aria-labelledby tracks the active tab. */}
        <div
          id="lbw-dockpanel"
          role="tabpanel"
          aria-labelledby={`lbw-docktab-${tab}`}
        >
        {tab === "overview" && (
          <>
            <div className="feat-id">
              <span className="feat-av">{d.name[0]}</span>
              <div>
                <div className="feat-name">
                  {d.name}{" "}
                  {isVerifiedOp(d.verif) && <span className="vchk">✓</span>}
                </div>
                <div className="mut mono" style={{ fontSize: 11 }}>
                  {d.handle.startsWith("@") ? d.handle : `· ${d.handle}`}
                </div>
              </div>
            </div>
            <div className="feat-meta">
              <span className="tag rank">#{d.rank} GLOBAL</span>
              <span className="tag">{d.klass}</span>
              <span className="tag arch">{d.arch}</span>
            </div>
            <div className="feat-yield">
              <div className="num">
                {d.y}
                <span style={{ fontSize: 20 }}>×</span>
              </div>
              <div className="lbl">YIELD (Υ)</div>
              <div className={`feat-delta ${dirUp ? "up" : "dn"}`}>
                {dirUp ? "▲" : "▼"} {deltaBody(d.delta)}
              </div>
            </div>
            <p className="feat-sub">{d.sub}</p>
            <p
              className="mut mono"
              style={{ fontSize: 9, letterSpacing: ".14em", marginTop: 14 }}
            >
              {COPY.privacy}
            </p>
          </>
        )}
        {tab === "cascade" &&
          (o ? (
            <CascadeTab o={o} />
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "activity" &&
          (o ? (
            <ActivityTab o={o} />
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "tools" &&
          (o ? (
            <ToolsTab o={o} />
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "history" &&
          (o || detail ? (
            <HistoryTab o={o} detail={detail} status={detailStatus} />
          ) : detailStatus === "loading" ? (
            <p className="drill-note">⟳ SYNCING HISTORY…</p>
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "records" &&
          (o || detail?.recs?.length || detail?.recordsStatic?.length ? (
            <RecordsTab
              recs={detail?.recs ?? o?.recs}
              detail={detail}
              status={detailStatus}
            />
          ) : detail == null && detailStatus === "loading" ? (
            <p className="drill-note">⟳ SYNCING RECORDS…</p>
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "share" && <SharePreview d={d} population={population} />}
        </div>
      </div>
      <div className="feat-r">
        {/* dual radar (owner 2026-10-06): chart + legend chips + caption stack
            in .dockr; the legend names both series compare-page style. */}
        <div className="dockr">
          <RadarChart vals={d.series} baseline={radarBase} />
          <div className="dockr-leg" aria-hidden>
            <span className="dockr-chip op">
              <i className="sw" />
              <span>{d.name}</span>
            </span>
            <span className="dockr-chip base">
              <i className="sw" />
              <span>{radarBase.label}</span>
            </span>
          </div>
          <div
            className="mut"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8.5px",
              letterSpacing: ".14em",
            }}
          >
            OPERATOR SIGNATURE
          </div>
        </div>
      </div>
    </section>
  );
}
