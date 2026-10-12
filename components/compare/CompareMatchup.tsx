/**
 * components/compare/CompareMatchup.tsx — CMP-MATCHUP (owner 2026-06-22).
 *
 * The combined main highlights box: opponent selectors on top, then two operator
 * panels split A | B. Each panel carries — on its OUTER edge — the identity block
 * (class glyph + name + class·#rank + Υ), and — inboard — that operator's top-5
 * derived facts (strengths △/✦ weaknesses). Each side tinted by its own class
 * color; the leading operator (more axis wins) carries the gold winner-glow.
 *
 * Folds the old CompareSelectors + CompareVersus into one box. Pure presentational
 * server component over two rows + the shared narrate/facts helpers — no fetch.
 */

import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import type { SignalClass } from "@/components/sigrank/types";
import { colors } from "@/components/sigrank/tokens";
import { glyphFor } from "@/lib/identity/canon-ids";
import {
  deriveFacts,
  compareTally,
  type OperatorFact,
} from "@/lib/analytics/compare-facts";
import {
  CompareSelectors,
  type CompareOption,
} from "@/components/compare/CompareSelectors";

const nameOf = operatorDisplayName;

function classColor(cls: SignalClass): string {
  if (cls === "TRANSMITTER") return colors.class.TRANSMITTER;
  const tier = cls.split(" ").slice(0, -1).join(" ");
  return (colors.class as Record<string, string>)[tier] ?? colors.class.BASE;
}

/** CSS-var token name for a class (e.g. 'ARCH+ I' → 'class-archplus'). */
function classVar(cls: SignalClass): string {
  if (cls === "TRANSMITTER") return "class-transmitter";
  const tier = cls.split(" ").slice(0, -1).join(" ");
  return "class-" + tier.toLowerCase().replace("+", "plus");
}

function yieldStr(r: LeaderboardRow): string {
  const c = r.snapshot.cascade;
  if (!c || c.nonCompounding) return "—";
  const y = c.yield_;
  // Small yields (e.g. The Field, a low-leverage baseline at ~0.36) must show
  // decimals — toFixed(0) rounded them to a misleading "0". ≥1000 → K-form,
  // ≥1 → whole, <1 → 2dp so a real positive yield never displays as zero.
  if (y >= 1000) return `${(y / 1000).toFixed(1)}K`;
  if (y >= 1) return y.toFixed(0);
  return y.toFixed(2);
}

/** A single fact line. ✦ strength · △ weakness · · neutral, theme-reactive.
 * Both panels render facts left-aligned (owner 2026-06-22: A + B formatted the same). */
function FactLine({ fact }: { fact: OperatorFact }) {
  const mark =
    fact.polarity === "up" ? "✦" : fact.polarity === "down" ? "△" : "·";
  const markColor =
    fact.polarity === "up"
      ? "text-gold"
      : fact.polarity === "down"
        ? "text-text-dim"
        : "text-text-muted";
  return (
    <li className="flex items-baseline gap-1.5 text-left">
      <span
        className={"font-mono text-[11px] leading-none " + markColor}
        aria-hidden
      >
        {mark}
      </span>
      <span className="min-w-0 font-sans text-[11px] leading-snug text-text-secondary">
        <span className="font-medium text-text-primary">{fact.label}</span>
        <span className="text-text-muted"> · {fact.detail}</span>
      </span>
    </li>
  );
}

export function CompareMatchup({
  a,
  b,
  options,
  hideSelectors = false,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
  options: CompareOption[];
  /** Workspace layout renders <CompareSelectors/> in its own stage cell
   *  (CMP-01 vs CMP-02); pass true to keep the matchup panels only. */
  hideSelectors?: boolean;
}) {
  const nameA = nameOf(a);
  const nameB = nameOf(b);
  const clsA = a.snapshot.class_tier as SignalClass;
  const clsB = b.snapshot.class_tier as SignalClass;
  const colA = classColor(clsA);
  const colB = classColor(clsB);

  const { aWins, bWins } = compareTally(a, b);
  const winner: "a" | "b" | null =
    aWins === bWins ? null : aWins > bWins ? "a" : "b";

  const factsA = deriveFacts(a, b);
  const factsB = deriveFacts(b, a);

  const Panel = ({
    r,
    side,
    cls,
    col,
    name,
    facts,
    won,
  }: {
    r: LeaderboardRow;
    side: "a" | "b";
    cls: SignalClass;
    col: string;
    name: string;
    facts: OperatorFact[];
    won: boolean;
  }) => {
    const cvar = classVar(cls);
    const tint = won ? 0.16 : 0.08;
    // Both panels formatted the SAME (owner 2026-06-22): identity LEFT, 5 points RIGHT.
    // Class tint still bleeds from each side's outer edge so the matchup stays distinct.
    const bg = `linear-gradient(${side === "a" ? "105deg" : "255deg"}, rgb(var(--${cvar}) / ${tint}), transparent 72%)`;
    const identity = (
      <div className="flex shrink-0 flex-col items-start gap-1 text-left">
        <span
          className="font-mono text-3xl leading-none"
          style={{ color: col }}
          aria-hidden
        >
          {glyphFor(cls)}
        </span>
        <span className="break-words font-mono text-sm font-bold text-text-primary">
          {name}
        </span>
        <span
          className="font-mono text-[11px] uppercase tracking-wide"
          style={{ color: col }}
        >
          {cls} · #{r.global_rank}
        </span>
        <span className="figure-rise mt-1 font-mono text-4xl font-bold leading-none text-gold">
          {yieldStr(r)}
        </span>
        <span className="font-mono text-[10px] text-text-muted">Υ Yield</span>
        {won && (
          <span className="mt-1 rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold">
            ◆ Leads {Math.max(aWins, bWins)}–{Math.min(aWins, bWins)}
          </span>
        )}
      </div>
    );
    const factList = (
      <ul className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {facts.length > 0 ? (
          facts.map((fact, i) => <FactLine key={i} fact={fact} />)
        ) : (
          <li className="font-sans text-[11px] text-text-muted">
            No cascade data yet.
          </li>
        )}
      </ul>
    );
    return (
      <div
        className={
          "relative flex min-w-0 flex-1 flex-row items-stretch gap-3 rounded-lg p-4 " +
          (won ? " winner-glow" : "")
        }
        style={{ background: bg }}
      >
        {identity}
        {factList}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-bg-border bg-bg-surface p-4">
      {!hideSelectors && (
        <CompareSelectors
          options={options}
          aCode={a.operator.codename}
          bCode={b.operator.codename}
        />
      )}
      <div className="flex items-stretch gap-2 sm:gap-4">
        <Panel
          r={a}
          side="a"
          cls={clsA}
          col={colA}
          name={nameA}
          facts={factsA}
          won={winner === "a"}
        />
        <div className="flex flex-col items-center justify-center gap-1 px-1 sm:px-2">
          <span
            className="font-mono text-3xl font-bold tracking-widest text-text-secondary sm:text-4xl"
            style={{ textShadow: `0 0 26px rgb(var(--gold) / 0.6)` }}
          >
            VS
          </span>
          <span className="font-mono text-base font-bold tabular-nums text-text-muted sm:text-lg">
            {aWins}–{bWins}
          </span>
        </div>
        <Panel
          r={b}
          side="b"
          cls={clsB}
          col={colB}
          name={nameB}
          facts={factsB}
          won={winner === "b"}
        />
      </div>
    </div>
  );
}
