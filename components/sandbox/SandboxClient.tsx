"use client";

/**
 * components/sandbox/SandboxClient.tsx — the interactive Cascade Lab.
 *
 * Sliders for the 4 token pillars + session/turn counts. Cascade metrics
 * (Υ, SNR, Leverage, Velocity, 10xDEV, $/1M) compute client-side from the
 * pillars. SignaRate + class compute server-side via /api/sandbox/score
 * (those use the secret RS.xx weights).
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  computeCascadeMetrics,
  fmt,
  type RawPillars,
} from "@/lib/cascade/metrics";
import { CascadeGenome } from "@/components/sandbox/CascadeGenome";
import type { SignalClass } from "@/components/sigrank/types";

interface ScoreResponse {
  signa_rate: number;
  class_tier: SignalClass;
  scores: { comp: number; sd: number; pc: number; ct: number; tt: number };
  signal_force: number;
  signal_force_raw: number;
  core5: {
    compression_ratio: number;
    prompt_complexity: number;
    cross_thread: number;
    session_depth: number;
    token_throughput: number;
  };
  compressionRatio: number;
  tokensTotal: number;
}

interface HistoryEntry {
  id: number;
  label: string;
  pillars: RawPillars;
  cascade: ReturnType<typeof computeCascadeMetrics>;
  signaRate: number;
  classTier: SignalClass;
  timestamp: string;
}

const CLASS_COLORS: Record<SignalClass, string> = {
  TRANSMITTER: "rgb(var(--class-transmitter))",
  "ARCH+": "rgb(var(--class-archplus))",
  ARCH: "rgb(var(--class-arch))",
  POWER: "rgb(var(--class-power))",
  BASE: "rgb(var(--class-base))",
  SEEKER: "rgb(var(--class-seeker))",
  REFINER: "rgb(var(--class-refiner))",
  BEARER: "rgb(var(--class-bearer))",
  IGNITER: "rgb(var(--class-igniter))",
};

const PILLAR_PRESETS: Record<
  string,
  { pillars: RawPillars; sessions: number; turns: number; label: string }
> = {
  moses: {
    label: "MO§ES (canonical SEED)",
    pillars: {
      input: 1_251_211,
      output: 11_296_121,
      cacheCreate: 128_196_310,
      cacheRead: 2_555_179_769,
    },
    sessions: 419,
    turns: 7_747,
  },
  archplus: {
    label: "ARCH+ operator",
    pillars: {
      input: 3_400_000,
      output: 5_600_000,
      cacheCreate: 68_000_000,
      cacheRead: 1_163_000_000,
    },
    sessions: 300,
    turns: 5_000,
  },
  power: {
    label: "POWER operator",
    pillars: {
      input: 2_000_000,
      output: 1_500_000,
      cacheCreate: 15_000_000,
      cacheRead: 200_000_000,
    },
    sessions: 150,
    turns: 2_500,
  },
  base: {
    label: "BASE operator",
    pillars: {
      input: 800_000,
      output: 400_000,
      cacheCreate: 3_000_000,
      cacheRead: 30_000_000,
    },
    sessions: 50,
    turns: 600,
  },
  burner: {
    label: "BURNER (no cache)",
    pillars: { input: 500_000, output: 100_000, cacheCreate: 0, cacheRead: 0 },
    sessions: 20,
    turns: 200,
  },
};

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  accent,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  accent?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))]">
          {label}
        </label>
        <span
          className="text-sm font-mono text-[rgb(var(--text-primary))]"
          style={{ color: accent }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full bg-[rgb(var(--bg-border))] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[rgb(var(--accent))]
                   [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-md border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
      <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-muted))]">
        {label}
      </span>
      <span
        className="text-xl font-mono font-bold"
        style={{ color: accent ?? "rgb(var(--text-primary))" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-[rgb(var(--text-dim))]">{sub}</span>
      )}
    </div>
  );
}

export function SandboxClient({
  initialPillars,
  readOnly = false,
}: {
  initialPillars?: RawPillars;
  readOnly?: boolean;
} = {}) {
  const [pillars, setPillars] = useState<RawPillars>(
    initialPillars ?? PILLAR_PRESETS.moses.pillars,
  );
  const [sessions, setSessions] = useState(PILLAR_PRESETS.moses.sessions);
  const [turns, setTurns] = useState(PILLAR_PRESETS.moses.turns);
  const [lifetime, setLifetime] = useState(50_000);
  const [accountAge, setAccountAge] = useState(365);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activePreset, setActivePreset] = useState(
    initialPillars ? "custom" : "moses",
  );
  const historyId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cascade = computeCascadeMetrics(pillars);

  const fetchScore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillars,
          sessionsCount: sessions,
          turnsTotal: turns,
          totalMessagesLifetime: lifetime,
          accountAgeDays: accountAge,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data);
      }
    } catch {
      // silent fail — cascade metrics still work client-side
    } finally {
      setLoading(false);
    }
  }, [pillars, sessions, turns, lifetime, accountAge]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchScore, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchScore]);

  const applyPreset = (key: string) => {
    const p = PILLAR_PRESETS[key];
    if (!p) return;
    setActivePreset(key);
    setPillars(p.pillars);
    setSessions(p.sessions);
    setTurns(p.turns);
  };

  const saveToHistory = () => {
    if (!score) return;
    const entry: HistoryEntry = {
      id: ++historyId.current,
      label: `Run ${historyId.current + 1}`,
      pillars: { ...pillars },
      cascade,
      signaRate: score.signa_rate,
      classTier: score.class_tier,
      timestamp: new Date().toISOString().split("T")[1]?.slice(0, 8) ?? "",
    };
    setHistory((h) => [...h.slice(-9), entry]);
  };

  const exportJson = () => {
    const data = {
      pillars,
      sessions,
      turns,
      cascade,
      score,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cascade-sandbox-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trajectoryData = history.map((h) => ({
    run: h.label,
    Υ: Math.round(h.cascade.yield_ * 100) / 100,
    Signa: Math.round(h.signaRate * 100) / 100,
    Leverage: Math.round(h.cascade.leverage * 10) / 10,
  }));

  const classColor = score ? CLASS_COLORS[score.class_tier] : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PILLAR_PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              activePreset === key
                ? "border-[rgb(var(--accent))] bg-[rgb(var(--bg-hover))] text-[rgb(var(--accent))]"
                : "border-[rgb(var(--bg-border))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--accent))]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* LEFT — sliders */}
        <div className="flex flex-col gap-4 p-4 rounded-lg border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
            Token Pillars
          </h3>
          <Slider
            label="Fresh Input"
            value={pillars.input}
            onChange={(v) => {
              setPillars((p) => ({ ...p, input: v }));
              setActivePreset("");
            }}
            min={0}
            max={10_000_000}
            step={50_000}
            format={(v) => fmt(v, { compact: true, decimals: 1 })}
            disabled={readOnly}
          />
          <Slider
            label="Output"
            value={pillars.output}
            onChange={(v) => {
              setPillars((p) => ({ ...p, output: v }));
              setActivePreset("");
            }}
            min={0}
            max={20_000_000}
            step={50_000}
            format={(v) => fmt(v, { compact: true, decimals: 1 })}
            disabled={readOnly}
          />
          <Slider
            label="Cache Create"
            value={pillars.cacheCreate}
            onChange={(v) => {
              setPillars((p) => ({ ...p, cacheCreate: v }));
              setActivePreset("");
            }}
            min={0}
            max={200_000_000}
            step={500_000}
            format={(v) => fmt(v, { compact: true, decimals: 1 })}
            disabled={readOnly}
          />
          <Slider
            label="Cache Read"
            value={pillars.cacheRead}
            onChange={(v) => {
              setPillars((p) => ({ ...p, cacheRead: v }));
              setActivePreset("");
            }}
            min={0}
            max={4_000_000_000}
            step={10_000_000}
            format={(v) => fmt(v, { compact: true, decimals: 1 })}
            disabled={readOnly}
          />

          <div className="h-px bg-[rgb(var(--bg-border))] my-1" />

          <h3 className="text-sm font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
            Session Context
          </h3>
          <Slider
            label="Sessions"
            value={sessions}
            onChange={(v) => {
              setSessions(v);
              setActivePreset("");
            }}
            min={1}
            max={1000}
            step={1}
            format={(v) => String(v)}
          />
          <Slider
            label="Turns"
            value={turns}
            onChange={(v) => {
              setTurns(v);
              setActivePreset("");
            }}
            min={1}
            max={20_000}
            step={10}
            format={(v) => String(v)}
          />
          <Slider
            label="Lifetime Messages"
            value={lifetime}
            onChange={(v) => setLifetime(v)}
            min={100}
            max={500_000}
            step={100}
            format={(v) => fmt(v, { compact: true, decimals: 0 })}
          />
          <Slider
            label="Account Age (days)"
            value={accountAge}
            onChange={(v) => setAccountAge(v)}
            min={1}
            max={2000}
            step={1}
            format={(v) => `${v}d`}
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={saveToHistory}
              disabled={!score}
              className="flex-1 px-3 py-2 text-xs rounded-md border border-[rgb(var(--accent))] text-[rgb(var(--accent))] hover:bg-[rgb(var(--bg-hover))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save to Trajectory
            </button>
            <button
              onClick={exportJson}
              className="flex-1 px-3 py-2 text-xs rounded-md border border-[rgb(var(--bg-border))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--accent))] transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* RIGHT — metrics + charts */}
        <div className="flex flex-col gap-4">
          {/* Headline metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard
              label="Υ Yield"
              value={fmt(cascade.yield_, { decimals: 2 })}
              sub={`lev ${fmt(cascade.leverage, { decimals: 1 })}× vel ${fmt(cascade.velocity, { decimals: 2 })}`}
              accent="rgb(var(--gold))"
            />
            <MetricCard
              label="SignaRate"
              value={score ? fmt(score.signa_rate, { decimals: 1 }) : "—"}
              sub={loading ? "computing..." : "server-scored"}
            />
            <MetricCard
              label="Class"
              value={score?.class_tier ?? "—"}
              sub={
                score ? `SF ${fmt(score.signal_force, { decimals: 1 })}` : ""
              }
              accent={classColor}
            />
            <MetricCard
              label="10xDEV"
              value={
                cascade.dev10x !== null
                  ? fmt(cascade.dev10x, { decimals: 2 })
                  : "—"
              }
              sub={cascade.cascadeStr !== "—" ? cascade.cascadeStr : "no cache"}
            />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricCard label="SNR" value={fmt(cascade.snr, { decimals: 3 })} />
            <MetricCard
              label="Scale V"
              value={fmt(cascade.scaleV, { decimals: 2 })}
            />
            <MetricCard
              label="$/1M"
              value={`$${fmt(cascade.costPerMillion, { decimals: 2 })}`}
            />
            <MetricCard
              label="Efficiency"
              value={fmt(cascade.efficiency, { decimals: 2 })}
            />
          </div>

          {/* Cascade Genome + Trajectory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {score && (
              <div className="p-3 rounded-lg border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
                <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                  Cascade Genome
                </h4>
                <CascadeGenome
                  scores={score.scores}
                  classAverage={{ comp: 60, sd: 58, pc: 50, ct: 45, tt: 70 }}
                  top1Percent={{ comp: 90, sd: 92, pc: 80, ct: 75, tt: 90 }}
                  compact
                />
              </div>
            )}

            {trajectoryData.length > 0 && (
              <div className="p-3 rounded-lg border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
                <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                  Trajectory
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trajectoryData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgb(var(--bg-border))"
                    />
                    <XAxis
                      dataKey="run"
                      tick={{ fill: "rgb(var(--text-muted))", fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: "rgb(var(--text-muted))", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(var(--bg-elevated))",
                        border: "1px solid rgb(var(--bg-border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line
                      type="monotone"
                      dataKey="Υ"
                      stroke="rgb(var(--gold))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Signa"
                      stroke="rgb(var(--accent))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Token flow area chart */}
          <div className="p-3 rounded-lg border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
            <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
              Token Distribution
            </h4>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart
                data={[
                  {
                    name: "Input",
                    tokens: pillars.input,
                    fill: "rgb(var(--text-dim))",
                  },
                  {
                    name: "Output",
                    tokens: pillars.output,
                    fill: "rgb(var(--accent))",
                  },
                  {
                    name: "Cache Create",
                    tokens: pillars.cacheCreate,
                    fill: "rgb(var(--class-power))",
                  },
                  {
                    name: "Cache Read",
                    tokens: pillars.cacheRead,
                    fill: "rgb(var(--gold))",
                  },
                ]}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgb(var(--text-muted))", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "rgb(var(--text-dim))", fontSize: 8 }}
                  tickFormatter={(v) => fmt(v, { compact: true, decimals: 0 })}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--bg-elevated))",
                    border: "1px solid rgb(var(--bg-border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                  formatter={(v) =>
                    fmt(Number(v), { compact: true, decimals: 1 })
                  }
                />
                <Area
                  dataKey="tokens"
                  stroke="rgb(var(--accent))"
                  fill="rgb(var(--accent))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History table */}
      {history.length > 0 && (
        <div className="p-3 rounded-lg border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
          <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
            Saved Runs ({history.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-[rgb(var(--text-muted))] border-b border-[rgb(var(--bg-border))]">
                  <th className="py-1 pr-3">Run</th>
                  <th className="py-1 pr-3">Υ</th>
                  <th className="py-1 pr-3">Signa</th>
                  <th className="py-1 pr-3">Class</th>
                  <th className="py-1 pr-3">Lev</th>
                  <th className="py-1 pr-3">Vel</th>
                  <th className="py-1 pr-3">SNR</th>
                  <th className="py-1 pr-3">10xDEV</th>
                  <th className="py-1 pr-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[rgb(var(--bg-border-subtle))]"
                  >
                    <td className="py-1 pr-3 text-[rgb(var(--text-secondary))]">
                      {h.label}
                    </td>
                    <td className="py-1 pr-3 text-[rgb(var(--gold))]">
                      {fmt(h.cascade.yield_, { decimals: 2 })}
                    </td>
                    <td className="py-1 pr-3">
                      {fmt(h.signaRate, { decimals: 1 })}
                    </td>
                    <td
                      className="py-1 pr-3"
                      style={{ color: CLASS_COLORS[h.classTier] }}
                    >
                      {h.classTier}
                    </td>
                    <td className="py-1 pr-3">
                      {fmt(h.cascade.leverage, { decimals: 1 })}×
                    </td>
                    <td className="py-1 pr-3">
                      {fmt(h.cascade.velocity, { decimals: 2 })}
                    </td>
                    <td className="py-1 pr-3">
                      {fmt(h.cascade.snr, { decimals: 3 })}
                    </td>
                    <td className="py-1 pr-3">
                      {h.cascade.dev10x !== null
                        ? fmt(h.cascade.dev10x, { decimals: 2 })
                        : "—"}
                    </td>
                    <td className="py-1 pr-3 text-[rgb(var(--text-dim))]">
                      {h.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
