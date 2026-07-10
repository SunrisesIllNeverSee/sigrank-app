import Link from "next/link";
import { Placeholder } from "@/components/ui/Placeholder";
import type { HomepageStats } from "@/lib/data";

/**
 * Draft2LiveActivity — the macro-stats "live activity" block. Five cells: Operators
 * ranked · Active last hour · TRANSMITTER K.01 · Comparisons ran · Total tokens
 * measured. Real values where getHomepageStats() has them; gold-star <Placeholder>
 * where the telemetry isn't wired yet.
 *
 * owner 2026-06-22: the "Real operators. Real cascades." headline (+ the leaderboard-
 * is-the-product framing + Full-board link) moved HERE from the retired Draft2BoardsGrid
 * (the 4 MiniBoards were archived). This block now owns the whole live-board section.
 *
 * Server component — pure render from injected stats, no clock/RNG.
 */
function fmtCount(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function Draft2LiveActivity({ stats }: { stats: HomepageStats }) {
  const real = !stats.isPlaceholder;

  const cells: {
    value: React.ReactNode;
    label: React.ReactNode;
    accent: boolean;
  }[] = [
    {
      value: real ? (
        <span title="Live — total operators ranked">
          {fmtCount(stats.total_operators)}
        </span>
      ) : (
        <Placeholder
          value="—"
          title="Placeholder — no real operator count yet"
        />
      ),
      label: "Operators ranked",
      accent: false,
    },
    {
      // Wired to operators.last_seen (daily-stale under ISR; the strip stays fogged).
      // A zero counter reads as anti-social-proof — show "—" until the field is live.
      value: real ? (
        <span title="Active operators in the last hour (by last_seen)">
          {stats.active_last_hour > 0 ? fmtCount(stats.active_last_hour) : "—"}
        </span>
      ) : (
        <Placeholder
          value="—"
          title="Placeholder — no active-user telemetry yet"
        />
      ),
      label: "Active in the last hour",
      accent: true,
    },
    {
      // TRANSMITTER class (K.01) — the real count from system_stats.transmitter_count.
      // Was ∞ (read as broken, not exclusive); now the honest integer, "—" until live.
      value: real ? (
        <span title="TRANSMITTER class (K.01)" className="text-gold">
          {stats.transmitter_count > 0
            ? fmtCount(stats.transmitter_count)
            : "—"}
        </span>
      ) : (
        <Placeholder
          value="—"
          title="Placeholder — transmitter count not wired yet"
        />
      ),
      label: "Operators in TRANSMITTER class",
      accent: false,
    },
    {
      // Wired to site_counters.comparisons_ran (bumped on a /compare matchup).
      // Hide at zero — an empty counter is worse than no counter.
      value: real ? (
        <span title="Total head-to-head comparisons run">
          {stats.comparisons_ran > 0 ? fmtCount(stats.comparisons_ran) : "—"}
        </span>
      ) : (
        <Placeholder
          value="—"
          title="Placeholder — comparison count not wired yet"
        />
      ),
      label: "Comparisons ran",
      accent: false,
    },
    {
      value: real ? (
        <span title="Live — total tokens scored across the field">
          {fmtCount(stats.total_tokens_scored)}
        </span>
      ) : (
        <Placeholder
          value="—"
          title="Placeholder — total tokens not computed yet"
        />
      ),
      label: "Total tokens measured",
      accent: false,
    },
  ];

  return (
    <section className="rounded-xl border border-bg-border bg-bg-surface p-5">
      {/* Section headline — moved here from the retired boards grid (owner 2026-06-22). */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            ⊙ Live board
          </div>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Real operators. Real cascades.
          </h2>
        </div>
        <Link
          href="/board/all"
          className="shrink-0 font-mono text-xs uppercase tracking-wide text-gold transition-colors hover:text-text-primary"
        >
          Full board →
        </Link>
      </div>
      {/* Live activity — collapsed on load + fogged "coming soon" (owner 2026-06-22).
          The macro-stats are mostly placeholders until telemetry is wired, so they live
          in a collapsed <details> behind a soft fog. Click to peek; the "coming soon"
          chip sets the expectation. <details> = no client island needed. */}
      <details className="group rounded-lg border border-bg-border-subtle bg-bg-base/40">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted transition-colors hover:text-text-secondary">
          <span className="text-text-dim group-open:hidden">▸</span>
          <span className="hidden text-text-dim group-open:inline">▾</span>
          Live activity
          <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[9px] normal-case tracking-normal text-gold">
            coming soon
          </span>
        </summary>

        {/* fogged stats — real data once telemetry lands; soft overlay until then */}
        <div className="relative px-3 pb-3">
          <div className="grid grid-cols-2 gap-px border border-bg-border-subtle bg-bg-border-subtle sm:grid-cols-3 lg:grid-cols-5">
            {cells.map((c, i) => (
              <div key={i} className="bg-bg-base px-4 py-5 text-left">
                <div
                  className={
                    "font-mono text-2xl font-semibold leading-none tracking-tight " +
                    (c.accent ? "text-gold" : "text-text-primary")
                  }
                >
                  {c.value}
                </div>
                <div className="mt-2 text-[11px] font-medium leading-snug text-text-muted">
                  {c.label}
                </div>
              </div>
            ))}
          </div>
          {/* fog */}
          <div className="pointer-events-none absolute inset-x-3 inset-y-0 flex items-center justify-center rounded-lg bg-bg-base/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-bg-border bg-bg-surface/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              ⊙ Live telemetry — coming soon
            </span>
          </div>
        </div>
      </details>
      {/* Leaderboard paragraph — moved to bottom of section (owner 2026-07-09). */}
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">
        The leaderboard is the product — scored live by the same engine that
        scores you.
      </p>
    </section>
  );
}
