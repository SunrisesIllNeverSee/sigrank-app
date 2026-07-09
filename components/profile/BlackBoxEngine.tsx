/**
 * components/profile/BlackBoxEngine.tsx — the sealed SIGNA RATE composite engine.
 *
 * Server component, but renders NOTHING proprietary: the RS.xx weights are never
 * imported here and never reach the markup. The engine is intentionally a black
 * box — Core 5 inputs flow IN, the result flows OUT, and the weighting in
 * between is shown only as "Ruleset v1.0 · Proprietary weights · ⊘ Locked".
 *
 * The Core 5 input chips and the final score are real (from the scored
 * snapshot). PC is rendered with its confidence (estimate vs exact) by the
 * caller — here we just display the value passed in.
 */

import { CanonId } from "@/components/ui/CanonId";

interface Props {
  /** Core 5 input chips (label + display value), in display order. */
  inputs: { label: string; value: string }[];
  /** The final SIGNA RATE [0,100]. */
  signaRate: number;
  /** Whether the operator carries the Audit Verified badge (BG.07). */
  auditVerified: boolean;
}

export function BlackBoxEngine({ inputs, signaRate, auditVerified }: Props) {
  return (
    <div
      className="grid grid-cols-1 items-center gap-5 border-t border-gold/25 p-7 lg:grid-cols-[1.2fr_40px_1.4fr_40px_1fr]"
      style={{
        background: "linear-gradient(180deg, rgba(245,160,32,0.06), #060b17)",
      }}
    >
      {/* Inputs */}
      <div>
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
          Core 5 inputs
        </div>
        <div className="flex flex-col gap-1.5">
          {inputs.map((i) => (
            <span
              key={i.label}
              className="flex items-baseline justify-between rounded-md border border-bg-border-subtle bg-bg-elevated px-3 py-1.5 font-mono text-xs"
            >
              <span className="font-medium text-text-muted">{i.label}</span>
              <span className="font-semibold text-text-primary">{i.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="hidden text-center font-mono text-2xl text-gold lg:block">
        <span aria-hidden="true">→</span>
      </div>

      {/* Sealed box — NO weights ever rendered here. */}
      <div
        className="relative overflow-hidden rounded-xl border border-gold/25 p-6 text-center"
        style={{
          background: "linear-gradient(180deg, #0b1525, #060b17)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(245,160,32,0.025) 8px, rgba(245,160,32,0.025) 9px)",
          }}
        />
        <div className="relative mb-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
          Scoring engine
        </div>
        <div className="relative mb-1.5 text-lg font-semibold tracking-[-0.01em] text-text-primary">
          SIGNA RATE Composite
        </div>
        <div className="relative flex flex-wrap justify-center gap-1.5 font-mono text-[11px] text-text-muted">
          <span>Ruleset v1.0</span>
          <span className="text-text-dim">·</span>
          <span>Proprietary weights</span>
          <span className="text-text-dim">·</span>
          <span className="font-semibold text-gold">⊘ Locked</span>
          <CanonId
            id="RS.01"
            title="Proprietary SIGNA weights — server-only, never exposed"
          />
        </div>
      </div>

      <div className="hidden text-center font-mono text-2xl text-gold lg:block">
        <span aria-hidden="true">→</span>
      </div>

      {/* Output */}
      <div className="text-left lg:text-right">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
          Your score
        </div>
        <div className="font-mono text-5xl font-bold leading-none tracking-[-0.025em] text-gold">
          {signaRate.toFixed(1)}
          <CanonId id="C.01" real title="SIGNA RATE composite (CANON C.01)" />
        </div>
        {auditVerified && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-class-seeker/25 bg-class-seeker/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-class-seeker">
              ✓ Audit Verified
              <CanonId id="BG.07" real title="Audit Verified badge (BG.07)" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
