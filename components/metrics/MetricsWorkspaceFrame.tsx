import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

const METRICS = [
  ["Yield (Υ) Cascade", "/metrics/yield-cascade"],
  ["Leverage", "/metrics/leverage"],
  ["Velocity", "/metrics/velocity"],
  ["Cache Hit Rate", "/metrics/cache-hit-rate"],
  ["Compression Ratio", "/metrics/compression-ratio"],
  ["Signal-to-Noise", "/metrics/signal-to-noise-ratio"],
  ["Efficiency", "/metrics/efficiency"],
] as const;

interface Props {
  /** Page name for the shell pagetitle strip (h1). */
  title: string;
  /** Marks the active entry in the METRICS rail nav. */
  current?: string;
  children: ReactNode;
  right?: ReactNode;
  rightTitle?: string;
  status?: ReactNode;
  /** Edge-to-edge stage hero band; suppresses the title strip. */
  hero?: ReactNode;
}

/**
 * Shared workspace frame for the /metrics/* reference pages — same
 * transfer contract as the Field family: family nav left, content stage,
 * citation/context right. Each page's WaveHero masthead retires; the
 * pagetitle strip carries the name.
 */
export function MetricsWorkspaceFrame({
  title,
  current,
  children,
  right,
  rightTitle = "REFERENCE",
  status,
  hero,
}: Props) {
  return (
    <WorkspaceShell
      active="wiki"
      title={title}
      bareTitle={hero != null}
      hero={hero}
      leftTitle="METRICS"
      left={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />METRICS</div>
            <nav className="ws-nav">
              <Link href="/metrics">← Metrics index</Link>
              {METRICS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={current === href ? "page" : undefined}
                  style={current === href ? { color: "var(--ac)" } : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />SYSTEM</div>
            <nav className="ws-nav">
              <Link href="/methodology">Methodology</Link>
              <Link href="/wiki">Wiki</Link>
              <Link href="/field">Field analysis</Link>
              <Link href="/board/all">Live leaderboard</Link>
            </nav>
          </div>
        </>
      }
      rightTitle={rightTitle}
      right={right}
      leftWidth={280}
      rightWidth={240}
      status={status ?? <>METRIC REFERENCE · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      <div className="ws-doc">{children}</div>
    </WorkspaceShell>
  );
}
