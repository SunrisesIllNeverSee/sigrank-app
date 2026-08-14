"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeCascadeMetrics,
  type CascadeMetrics,
  type RawPillars,
} from "@/lib/analytics/cascade";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import type {
  LiveTelemetrySnapshot,
  LiveTelemetryState,
} from "@/lib/live/types";
import styles from "./SignalLiveDemo.module.css";

type Mode = "simulated" | "live";
type Scene =
  | "ready"
  | "listening"
  | "cascade-a"
  | "switch"
  | "cascade-b"
  | "compare"
  | "identify"
  | "final";

interface DemoSnapshot extends LiveTelemetrySnapshot {
  label: string;
}

const DURATION_SECONDS = 90;

const MODEL_A: DemoSnapshot = {
  label: "A",
  operator: "MO§ES™",
  model: "CLAUDE SONNET 4.5",
  context: "SIGRANK / LIVE INSTRUMENT",
  observedAt: "",
  pillars: {
    input: 18_000,
    output: 31_000,
    cacheCreate: 180_000,
    cacheRead: 4_200_000,
  },
};

const MODEL_B: DemoSnapshot = {
  label: "B",
  operator: "MO§ES™",
  model: "CODEX",
  context: "SIGRANK / LIVE INSTRUMENT",
  observedAt: "",
  pillars: {
    input: 28_000,
    output: 36_000,
    cacheCreate: 300_000,
    cacheRead: 2_550_000,
  },
};

const START_PILLARS: RawPillars = {
  input: 720,
  output: 80,
  cacheCreate: 0,
  cacheRead: 0,
};

const SCENE_STARTS: Record<Scene, number> = {
  ready: 0,
  listening: 0,
  "cascade-a": 7,
  switch: 42,
  "cascade-b": 48,
  compare: 69,
  identify: 78,
  final: 87,
};

const SIGNATURE_CANDIDATES = [
  { name: "OPERATOR 128", match: 41.6 },
  { name: "OPERATOR 407", match: 58.3 },
  { name: "MO§ES™", match: 94.2 },
  { name: "OPERATOR 811", match: 63.9 },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOut(value: number) {
  return 1 - Math.pow(1 - clamp(value), 3);
}

function interpolatePillars(
  from: RawPillars,
  to: RawPillars,
  progress: number,
  pulse: number,
): RawPillars {
  const eased = easeOut(progress);
  const interpolate = (start: number, end: number, jitter = 0) =>
    Math.max(0, Math.round(start + (end - start) * eased + jitter));

  return {
    input: interpolate(from.input, to.input, pulse * 14),
    output: interpolate(from.output, to.output, pulse * 31),
    cacheCreate: interpolate(from.cacheCreate, to.cacheCreate, pulse * 120),
    cacheRead: interpolate(from.cacheRead, to.cacheRead, pulse * 1_900),
  };
}

function sceneAt(seconds: number): Scene {
  if (seconds >= 87) return "final";
  if (seconds >= 78) return "identify";
  if (seconds >= 69) return "compare";
  if (seconds >= 48) return "cascade-b";
  if (seconds >= 42) return "switch";
  if (seconds >= 7) return "cascade-a";
  return "listening";
}

function compact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function metric(value: number, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 10_000) return compact(value);
  return value.toFixed(decimals);
}

function percentileOf(value: number, sortedField: number[]) {
  if (!sortedField.length) return 0;
  let low = 0;
  let high = sortedField.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (sortedField[middle] <= value) low = middle + 1;
    else high = middle;
  }
  return (low / sortedField.length) * 100;
}

function cascadeState(pillars: RawPillars, cascade: CascadeMetrics) {
  if (pillars.cacheCreate === 0 && pillars.cacheRead === 0) return "BURNING";
  if (cascade.leverage < 10) return "BUILDING";
  return "COMPOUNDING";
}

function snapshotWithPillars(
  source: DemoSnapshot,
  pillars: RawPillars,
): DemoSnapshot {
  return { ...source, pillars };
}

function CascadeTrace({
  snapshot,
  elapsed,
  quiet,
}: {
  snapshot: DemoSnapshot;
  elapsed: number;
  quiet?: boolean;
}) {
  const cascade = computeCascadeMetrics(snapshot.pillars);
  const leverageHeight = clamp(Math.log10(cascade.leverage + 1) / 3);
  const velocityHeight = clamp(cascade.velocity / 2);
  const phase = elapsed * 1.6;
  const y1 = 98 - leverageHeight * 44;
  const y2 = 122 - velocityHeight * 54;
  const wave = Math.sin(phase) * 5;

  return (
    <svg
      className={styles.trace}
      viewBox="0 0 760 250"
      preserveAspectRatio="none"
      role="img"
      aria-label="Live token cascade trace"
    >
      <defs>
        <linearGradient id="trace-fade" x1="0" x2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.12" />
          <stop offset="0.22" stopColor="white" stopOpacity="0.92" />
          <stop offset="0.82" stopColor="white" stopOpacity="0.92" />
          <stop offset="1" stopColor="white" stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {[40, 80, 120, 160, 200].map((y) => (
        <line key={y} x1="0" x2="760" y1={y} y2={y} className={styles.gridLine} />
      ))}
      {[95, 190, 285, 380, 475, 570, 665].map((x) => (
        <line key={x} x1={x} x2={x} y1="0" y2="250" className={styles.gridLine} />
      ))}
      <path
        className={styles.inputTrace}
        d={`M 0 136 C 80 ${138 + wave}, 135 ${112 - wave}, 205 124 S 315 ${154 + wave}, 390 132 S 510 116, 760 130`}
      />
      <path
        className={styles.cacheTrace}
        style={{ opacity: quiet ? 0.18 : 0.38 + leverageHeight * 0.62 }}
        d={`M 0 178 C 84 176, 128 ${y1 + wave}, 225 ${y1} S 342 ${y1 - 28}, 438 ${y1 + 3} S 575 ${y1 - wave}, 760 ${y1 - 14}`}
      />
      <path
        className={styles.outputTrace}
        style={{ opacity: quiet ? 0.16 : 0.42 + velocityHeight * 0.58 }}
        d={`M 0 198 C 100 202, 145 ${y2 - wave}, 248 ${y2} S 350 ${y2 + 28}, 470 ${y2 - 10} S 610 ${y2 + wave}, 760 ${y2 - 22}`}
      />
      <line x1="585" x2="585" y1="20" y2="226" className={styles.scanLine} />
      <circle cx="585" cy={y1 - 5} r="4" className={styles.tracePoint} />
      <text x="18" y="28" className={styles.traceLabel}>INPUT</text>
      <text x="18" y="54" className={styles.traceLabel}>CACHE</text>
      <text x="18" y="80" className={styles.traceLabel}>OUTPUT</text>
    </svg>
  );
}

function MetricColumn({ cascade }: { cascade: CascadeMetrics }) {
  const rows = [
    { label: "YIELD", value: metric(cascade.yield_, 1), suffix: "Υ" },
    { label: "LEVERAGE", value: metric(cascade.leverage, 0), suffix: "×" },
    { label: "VELOCITY", value: metric(cascade.velocity, 2), suffix: "" },
    { label: "SNR", value: metric(cascade.snr, 3), suffix: "" },
  ];

  return (
    <aside className={styles.metrics} aria-label="Current cascade metrics">
      <div className={styles.panelLabel}>CURRENT CASCADE</div>
      {rows.map((row) => (
        <div className={styles.metricRow} key={row.label}>
          <div className={styles.metricLabel}>{row.label}</div>
          <div className={styles.metricValue}>
            {row.value}<span>{row.suffix}</span>
          </div>
          <div className={styles.metricTick}>↗</div>
        </div>
      ))}
    </aside>
  );
}

function CompareScene({ a, b }: { a: DemoSnapshot; b: DemoSnapshot }) {
  const aMetrics = computeCascadeMetrics(a.pillars);
  const bMetrics = computeCascadeMetrics(b.pillars);
  const delta = ((bMetrics.yield_ - aMetrics.yield_) / aMetrics.yield_) * 100;
  const rows = [
    ["YIELD", metric(aMetrics.yield_, 1), metric(bMetrics.yield_, 1)],
    ["LEVERAGE", `${metric(aMetrics.leverage, 0)}×`, `${metric(bMetrics.leverage, 0)}×`],
    ["VELOCITY", metric(aMetrics.velocity, 2), metric(bMetrics.velocity, 2)],
    ["SNR", metric(aMetrics.snr, 3), metric(bMetrics.snr, 3)],
  ];

  return (
    <div className={styles.compareScene}>
      <div className={styles.compareConstant}>HUMAN + CONTEXT HELD CONSTANT</div>
      <div className={styles.compareHead}>
        <span>{a.model}</span>
        <span className={styles.versus}>×</span>
        <span>{b.model}</span>
      </div>
      <div className={styles.compareGrid}>
        {rows.map(([label, left, right]) => (
          <div className={styles.compareRow} key={label}>
            <strong>{left}</strong><span>{label}</span><strong>{right}</strong>
          </div>
        ))}
      </div>
      <div className={styles.interactionDelta}>
        <span>HUMAN × MODEL INTERACTION</span>
        <strong>{delta.toFixed(0)}%</strong>
      </div>
    </div>
  );
}

function SignatureScene() {
  const bars = [18, 42, 27, 74, 58, 92, 46, 82, 35, 64, 88, 52, 29, 78, 96, 61, 43, 84];
  return (
    <div className={styles.signatureScene}>
      <div className={styles.signaturePrompt}>CAN OPERATING ARCHITECTURE IDENTIFY THE HUMAN?</div>
      <div className={styles.signatureBody}>
        <div className={styles.fingerprint} aria-hidden>
          {bars.map((height, index) => (
            <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 34}ms` }} />
          ))}
        </div>
        <div className={styles.candidates}>
          {SIGNATURE_CANDIDATES.map((candidate) => (
            <div
              className={candidate.name === "MO§ES™" ? styles.candidateMatch : styles.candidate}
              key={candidate.name}
            >
              <span>{candidate.name}</span>
              <i><b style={{ width: `${candidate.match}%` }} /></i>
              <strong>{candidate.match.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.signatureAcquired}>
        <span>OPERATOR SIGNATURE ACQUIRED</span>
        <strong>MO§ES™</strong>
        <small>PROTOTYPE SHAPE MATCH · 94.2%</small>
      </div>
    </div>
  );
}

function FinalScene() {
  return (
    <div className={styles.finalScene}>
      <div className={styles.finalRule} />
      <p>MODELS HAVE EVALS.</p>
      <h2>NOW THEIR OPERATORS DO TOO.</h2>
      <div className={styles.finalBoardFrame}>
        <img
          src="/live/leaderboard-board.png"
          alt="SigRank live leaderboard — operators ranked by Yield"
          className={styles.finalBoardImage}
        />
      </div>
      <a
        href="https://signalaf.com/score"
        className={styles.finalCta}
        target="_blank"
        rel="noopener noreferrer"
      >
        GET RANKED NOW <span>→</span>
      </a>
      <div className={styles.finalBrand}>SIGNALAF.COM <span>◈</span></div>
    </div>
  );
}

export function SignalLiveDemo({ fieldYields }: { fieldYields: number[] }) {
  const [mode, setMode] = useState<Mode>("simulated");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 4>(1);
  const [liveState, setLiveState] = useState<LiveTelemetryState>({
    status: "waiting",
    sequence: 0,
    snapshot: null,
  });
  const [livePair, setLivePair] = useState<[DemoSnapshot, DemoSnapshot] | null>(null);
  const startRef = useRef(0);
  const baseElapsedRef = useRef(0);
  const previousLiveRef = useRef<DemoSnapshot | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (mode !== "simulated" || !running) return;
    let frame = 0;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const next = baseElapsedRef.current + ((now - startRef.current) / 1000) * speed;
      if (next >= DURATION_SECONDS) {
        setElapsed(DURATION_SECONDS);
        baseElapsedRef.current = DURATION_SECONDS;
        setRunning(false);
        return;
      }
      setElapsed(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, running, speed]);

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as LiveTelemetryState;
        if (cancelled) return;
        setLiveState((current) => {
          if (next.sequence === current.sequence || !next.snapshot) return next;
          const incoming: DemoSnapshot = { ...next.snapshot, label: "LIVE" };
          const previous = previousLiveRef.current;
          if (previous && previous.model !== incoming.model) {
            setLivePair([previous, incoming]);
          }
          previousLiveRef.current = incoming;
          return next;
        });
      } catch {
        if (!cancelled) {
          setLiveState((current) => ({ ...current, status: "waiting" }));
        }
      }
    };
    void poll();
    const timer = window.setInterval(poll, 700);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode]);

  const reset = useCallback(() => {
    baseElapsedRef.current = 0;
    setElapsed(0);
    setRunning(false);
  }, []);

  const toggleRun = useCallback(() => {
    if (elapsed >= DURATION_SECONDS) {
      baseElapsedRef.current = 0;
      setElapsed(0);
    } else {
      baseElapsedRef.current = elapsed;
    }
    setRunning((value) => !value);
  }, [elapsed]);

  const skipTo = useCallback((seconds: number) => {
    const next = clamp(seconds, 0, DURATION_SECONDS);
    baseElapsedRef.current = next;
    setElapsed(next);
    if (running) startRef.current = performance.now();
  }, [running]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (mode !== "simulated" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggleRun();
      }
      if (event.key.toLowerCase() === "r") reset();
      if (event.key === "ArrowRight") skipTo(elapsed + 8);
      if (event.key === "ArrowLeft") skipTo(elapsed - 8);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [elapsed, mode, reset, skipTo, toggleRun]);

  const scene = mode === "simulated" ? (elapsed === 0 && !running ? "ready" : sceneAt(elapsed)) : livePair ? "compare" : "cascade-a";
  const pulse = Math.sin(elapsed * 2.7);

  const simulatedSnapshot = useMemo(() => {
    if (elapsed < 7) return snapshotWithPillars(MODEL_A, START_PILLARS);
    if (elapsed < 42) {
      return snapshotWithPillars(
        MODEL_A,
        interpolatePillars(START_PILLARS, MODEL_A.pillars, (elapsed - 7) / 35, pulse),
      );
    }
    if (elapsed < 48) return MODEL_A;
    if (elapsed < 69) {
      return snapshotWithPillars(
        MODEL_B,
        interpolatePillars(START_PILLARS, MODEL_B.pillars, (elapsed - 48) / 21, pulse),
      );
    }
    return MODEL_B;
  }, [elapsed, pulse]);

  const liveSnapshot: DemoSnapshot = liveState.snapshot
    ? { ...liveState.snapshot, label: "LIVE" }
    : {
        ...MODEL_A,
        label: "LIVE",
        operator: "WAITING FOR SIGNAL",
        model: "NO MODEL DETECTED",
        context: "POST A TELEMETRY SNAPSHOT",
        pillars: START_PILLARS,
      };

  const snapshot = mode === "simulated" ? simulatedSnapshot : liveSnapshot;
  const cascade = computeCascadeMetrics(snapshot.pillars);
  const construction = snapshot.pillars.cacheRead > 0
    ? snapshot.pillars.cacheCreate / snapshot.pillars.cacheRead
    : 0;
  const archetype = buildArchetypeOf({
    leverage: cascade.leverage,
    velocity: cascade.velocity,
    construction,
  });
  const percentile = percentileOf(cascade.yield_, fieldYields);
  const topPercent = Math.max(0.1, 100 - percentile);
  const reusedShare = snapshot.pillars.cacheRead > 0
    ? snapshot.pillars.cacheRead /
      (snapshot.pillars.input + snapshot.pillars.cacheCreate + snapshot.pillars.cacheRead)
    : 0;
  const progress = mode === "simulated" ? (elapsed / DURATION_SECONDS) * 100 : 100;
  const comparison = mode === "simulated" ? [MODEL_A, MODEL_B] as const : livePair;

  const setNextScene = () => {
    const order: Scene[] = ["listening", "cascade-a", "switch", "cascade-b", "compare", "identify", "final"];
    const index = Math.max(0, order.indexOf(scene));
    skipTo(SCENE_STARTS[order[Math.min(order.length - 1, index + 1)]]);
  };

  return (
    <div className={styles.shell} data-scene={scene}>
      <div className={styles.noise} aria-hidden />
      <header className={styles.header}>
        <div className={styles.brand}><span>◈</span> SIGNALAF <b>LIVE</b></div>
        <div className={styles.thesis}>HUMAN <i>×</i> CONTEXT <i>×</i> MODEL</div>
        <div className={styles.controls}>
          <button
            className={mode === "simulated" ? styles.activeControl : ""}
            onClick={() => { setMode("simulated"); setLivePair(null); }}
          >SIMULATED</button>
          <button
            className={mode === "live" ? styles.activeControl : ""}
            onClick={() => { setMode("live"); setRunning(false); }}
          >LIVE INPUT</button>
        </div>
      </header>

      <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>

      {scene === "final" ? (
        <FinalScene />
      ) : scene === "identify" ? (
        <SignatureScene />
      ) : scene === "compare" && comparison ? (
        <CompareScene a={comparison[0]} b={comparison[1]} />
      ) : (
        <main className={styles.instrument}>
          <aside className={styles.identity}>
            <div className={styles.panelLabel}>SYSTEM UNDER TEST</div>
            <section>
              <span>HUMAN</span>
              <strong>{snapshot.operator}</strong>
              <small>{archetype.familyLabel.toUpperCase()}</small>
            </section>
            <section>
              <span>CONTEXT</span>
              <strong>{snapshot.context}</strong>
              <small>{(reusedShare * 100).toFixed(0)}% REUSED STATE</small>
            </section>
            <section>
              <span>MODEL</span>
              <strong>{scene === "switch" ? "CHANGING MODEL…" : snapshot.model}</strong>
              <small>{mode === "live" ? "EXTERNAL TELEMETRY" : "DEMO STREAM"}</small>
            </section>
            <div className={styles.privacy}>PROMPTS NEVER LEAVE DEVICE</div>
          </aside>

          <section className={styles.scope}>
            <div className={styles.scopeTop}>
              <span>{mode === "live" ? (liveState.status === "live" ? "RECEIVING" : "LISTENING") : scene === "ready" ? "READY" : "SESSION 01 / 02"}</span>
              <span>{compact(snapshot.pillars.input)} IN · {compact(snapshot.pillars.cacheRead)} CACHE · {compact(snapshot.pillars.output)} OUT</span>
            </div>
            <CascadeTrace snapshot={snapshot} elapsed={elapsed} quiet={scene === "ready" || scene === "listening"} />
            <div className={styles.stateWord} data-word={cascadeState(snapshot.pillars, cascade)}>
              {scene === "ready" ? "AN EKG FOR THE HUMAN–AI SYSTEM" : scene === "listening" ? "LISTENING FOR AI ACTIVITY" : cascadeState(snapshot.pillars, cascade)}
            </div>
            <div className={styles.axisLegend}>
              <span>FRESH INPUT</span><i />
              <span>REUSED CONTEXT</span><i />
              <span>GENERATED OUTPUT</span>
            </div>
          </section>

          <MetricColumn cascade={cascade} />
        </main>
      )}

      {scene !== "final" && scene !== "identify" && scene !== "compare" && (
        <footer className={styles.fieldFooter}>
          <div className={styles.archetype}>
            <span>BUILD ARCHETYPE</span>
            <strong>{archetype.name}</strong>
          </div>
          <div className={styles.fieldScale}>
            <div><span>FIELD POSITION</span><b>1,627 MEASURED OPERATORS</b></div>
            <div className={styles.scaleLine}>
              <i style={{ left: `${clamp(percentile, 1, 99)}%` }}><b>YOU</b></i>
            </div>
            <div className={styles.scaleLabels}><span>0</span><span>MEDIAN</span><span>100</span></div>
          </div>
          <div className={styles.percentile}>
            <span>OPERATING IN THE</span>
            <strong>TOP {topPercent < 10 ? topPercent.toFixed(1) : topPercent.toFixed(0)}%</strong>
            <small>P{percentile.toFixed(1)}</small>
          </div>
        </footer>
      )}

      <div className={styles.transport}>
        {mode === "simulated" ? (
          <>
            <button className={styles.primaryButton} onClick={toggleRun}>
              {running ? "PAUSE" : elapsed > 0 && elapsed < DURATION_SECONDS ? "RESUME" : "RUN 90S DEMO"}
            </button>
            <button onClick={reset}>RESET</button>
            <button onClick={setNextScene}>NEXT SCENE</button>
            <button onClick={() => setSpeed(speed === 1 ? 4 : 1)}>{speed}× SPEED</button>
            <span>{Math.floor(elapsed).toString().padStart(2, "0")} / 90 SEC</span>
          </>
        ) : (
          <>
            <i className={liveState.status === "live" ? styles.liveDot : styles.waitingDot} />
            <span>{liveState.status === "live" ? `LIVE · PACKET ${liveState.sequence}` : "WAITING · POST TO /API/LIVE"}</span>
            {livePair && <button onClick={() => setLivePair(null)}>RETURN TO STREAM</button>}
          </>
        )}
      </div>
    </div>
  );
}
