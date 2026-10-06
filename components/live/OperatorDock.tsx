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
 * surface fields already present on LiveOperator (no fabricated data —
 * absent values render "—").
 *
 * fetchDetail(codename) is optional: when supplied, the dock fetches the
 * operator detail once per selection (WS-4) and overlays it onto the row
 * fields for the drill tabs. The workspace renders standalone without it.
 */
import { useEffect, useMemo, useState } from "react";
import type {
  LiveOperator,
  LivePopulation,
} from "@/lib/board/live-types";
import {
  COPY,
  RADAR_AXES,
  deltaBody,
  deltaUp,
  mvLabel,
  type ProfileView,
} from "./utils";
import { Sparkline } from "./rows";

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

/* ---------- radar (board.js radar(), verbatim geometry) ---------- */
export function RadarChart({
  vals,
  size = 190,
}: {
  vals: number[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;
  const N = vals.length;
  const pt = (i: number, r: number): readonly [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R];
  };
  const poly = (rr: number) => vals.map((_, i) => pt(i, rr).join(",")).join(" ");
  const pts = vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {[0.33, 0.66, 1].map((r) => (
        <polygon
          key={r}
          points={poly(r)}
          fill="none"
          stroke="var(--line2)"
          strokeWidth={1}
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
      <polygon
        points={pts}
        fill="color-mix(in srgb, var(--ac) 22%, transparent)"
        stroke="var(--ac)"
        strokeWidth={1.6}
      />
      {vals.map((v, i) => {
        const [x, y] = pt(i, v);
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
  const slug = encodeURIComponent(d.op?.slug ?? d.name);
  return (
    <div className="shareprev">
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
        <span className="av">{d.name[0]}</span>
        <div>
          <div className="pn">
            {d.name} <span className="vchk">✓</span>
          </div>
          <div className="ph">
            {d.handle.startsWith("@") ? d.handle : `· ${d.handle}`} · #{d.rank}
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
        TOOL / MODEL / MCP USAGE PROJECTION — WIRES AT WS-4
      </p>
    </div>
  );
}

function HistoryTab({ o }: { o: LiveOperator }) {
  return (
    <div className="drill">
      <DrillRows
        rows={[
          ["TREND POINTS", o.trend?.length ?? 0],
          ["ACCOUNT AGE", `${o.age}d`],
          ["MESSAGES", o.msgs.toLocaleString()],
          ["∑ OBSERVED", o.total],
          ["PERCENTILE", `${o.pct}`],
        ]}
      />
      <p className="drill-note">
        HISTORY / TRAJECTORY SERIES — /api/v1/operators/{"{codename}"}/history
      </p>
    </div>
  );
}

function RecordsTab({ o }: { o: LiveOperator }) {
  if (!o.recs?.length) {
    return <p className="drill-note">— NO RECORDS IN THIS SCOPE</p>;
  }
  return (
    <div className="srows" style={{ marginTop: 0 }}>
      {o.recs.map((r, k) => (
        <div className="srow" key={k}>
          <span className="sl2">{r.metric.toUpperCase()}</span>
          <span className="mono mut" style={{ fontSize: 9 }}>
            {r.window.toUpperCase()}
          </span>
          <span className="sv2">
            #{r.rank} · {r.value}
          </span>
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
  fetchDetail,
}: {
  d: ProfileView;
  /** true → this card renders hidden; profile lives in the rail module. */
  docked: boolean;
  onToggleDock: () => void;
  population: LivePopulation;
  fetchDetail?: (
    codename: string,
  ) => Promise<Partial<LiveOperator> | void> | Partial<LiveOperator> | void;
}) {
  const [tab, setTab] = useState<DockTab>("overview");
  const [detail, setDetail] = useState<Partial<LiveOperator> | null>(null);
  const codename = d.op?.codename ?? null;

  /* WS-4 drill enrichment — optional; cached per selection inside the
     component that mounts this dock (each selection re-mounts via key). */
  useEffect(() => {
    setDetail(null);
    setTab("overview");
    if (!fetchDetail || !codename) return;
    let alive = true;
    Promise.resolve(fetchDetail(codename))
      .then((res) => {
        if (alive && res) setDetail(res);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [fetchDetail, codename]);

  const o = useMemo<LiveOperator | null>(
    () => (d.op ? { ...d.op, ...(detail ?? {}) } : null),
    [d.op, detail],
  );

  const dirUp = deltaUp(d.delta);
  return (
    <section
      className="feat"
      style={docked ? { display: "none" } : undefined}
      aria-label="Selected operator"
    >
      <button
        className="dockbtn"
        title="dock into right rail"
        onClick={onToggleDock}
      >
        ⇄ TO RAIL
      </button>
      <div className="feat-l">
        <div className="docktabs" role="tablist" aria-label="Operator sections">
          {DOCK_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "on" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <>
            <div className="feat-id">
              <span className="feat-av">{d.name[0]}</span>
              <div>
                <div className="feat-name">
                  {d.name} <span className="vchk">✓</span>
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
          (o ? (
            <HistoryTab o={o} />
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "records" &&
          (o ? (
            <RecordsTab o={o} />
          ) : (
            <p className="drill-note">— FIELD DATA UNAVAILABLE</p>
          ))}
        {tab === "share" && <SharePreview d={d} population={population} />}
      </div>
      <div className="feat-r">
        {/* reference: svg + label are direct flex children of .feat-r */}
        <RadarChart vals={d.series} />
        <div
          className="mut"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: ".14em",
            marginTop: 6,
          }}
        >
          OPERATOR SIGNATURE
        </div>
      </div>
    </section>
  );
}
