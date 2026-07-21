"use client";

/**
 * components/profile/ScoreBreakdown.tsx — the black-box score-breakdown card.
 *
 * 'use client': owns the Free/Pro tier toggle. It NEVER imports the scoring
 * ruleset (RS.xx weights stay server-only) and NEVER calls the AuditProvider
 * itself — all Pro / not-yet-finalized values are resolved server-side (the page
 * calls getAuditProvider) and passed in as plain, serializable props. The
 * black-box composite is rendered by <BlackBoxEngine>, which shows inputs →
 * sealed engine → result without ever exposing a weight.
 *
 * The PC conversion row shows the estimate preview (the upgrade gate / ProGate was
 * removed 2026-06-22 while billing is dormant — exact-PC Pro unlock returns with
 * Stripe-live). Reserved Pro metrics not finalized render as "Coming to Pro" slots.
 */

import { useState } from "react";
import { CanonId } from "@/components/ui/CanonId";
import { Placeholder } from "@/components/ui/Placeholder";
import { TelemetryStrip } from "./TelemetryStrip";
import { BlackBoxEngine } from "./BlackBoxEngine";
import type { TelemetryRaw } from "@/lib/board";

/** A reserved Pro metric slot, resolved server-side via getProMetric(). */
export interface ProMetricSlot {
  canonId: string;
  label: string;
  desc: string;
  value: number | null;
  finalized: boolean;
}

interface Props {
  operatorId: string;
  /** Resolved server-side from getSupporterTier — true for pro / circle_sponsor. */
  isPro: boolean;
  /** Whether the operator holds the Audit Verified badge (BG.07). */
  auditVerified: boolean;
  telemetry: TelemetryRaw;
  /** Free-tier PC estimate (from the snapshot). */
  pcEstimate: number;
  /** Exact PC (M.02) resolved server-side via AuditProvider, or null. */
  pcExact: number | null;
  /** Core 5 display values. */
  compDisplay: string;
  ctDisplay: string;
  sdDisplay: string;
  ttDisplay: string;
  signaRate: number;
  /** Reserved-but-not-finalized Pro metrics, resolved server-side. */
  proSlots: ProMetricSlot[];
}

type Tier = "free" | "pro";

interface ConvRow {
  inputHead: string;
  formula: React.ReactNode;
  inputs: React.ReactNode;
  outHead: React.ReactNode;
  title: string;
  desc: string;
  score: React.ReactNode;
  delta?: string;
  pill: { kind: "clean" | "strong" | "weak"; label: string };
  conf: string;
}

function Pill({
  kind,
  label,
}: {
  kind: "clean" | "strong" | "weak";
  label: string;
}) {
  const cls =
    kind === "clean"
      ? "border-class-seeker/25 bg-class-seeker/10 text-class-seeker"
      : kind === "strong"
        ? "border-class-archplus/20 bg-class-archplus/10 text-class-archplus"
        : "border-gold/25 bg-gold/10 text-gold";
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function Row({ row }: { row: ConvRow }) {
  return (
    <div className="grid grid-cols-1 items-center gap-6 border-b border-bg-border-subtle px-7 py-5 transition-colors last:border-b-0 hover:bg-bg-elevated md:grid-cols-[220px_40px_1fr_90px_90px]">
      <div className="flex flex-col gap-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-text-secondary">
          {row.inputHead}
        </div>
        <div className="font-mono text-xs leading-snug text-text-secondary">
          {row.formula}
        </div>
        <div className="mt-1 font-mono text-xs font-medium text-text-primary">
          Inputs: {row.inputs}
        </div>
      </div>
      <div className="hidden text-center font-mono text-[22px] leading-none text-gold md:block">
        →
      </div>
      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.05em] text-gold">
          {row.outHead}
        </div>
        <h4 className="mb-0.5 text-[15px] font-semibold tracking-[-0.01em] text-text-primary">
          {row.title}
        </h4>
        <p className="text-xs leading-snug text-text-muted">{row.desc}</p>
      </div>
      <div className="text-left md:text-right">
        <div className="font-mono text-2xl font-semibold leading-none tracking-[-0.02em] text-text-primary">
          {row.score}
        </div>
        {row.delta && (
          <div className="mt-1 font-mono text-[10px] font-medium text-class-seeker">
            {row.delta}
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 md:items-end">
        <Pill kind={row.pill.kind} label={row.pill.label} />
        <span className="font-mono text-[10px] text-text-secondary">
          {row.conf}
        </span>
      </div>
    </div>
  );
}

export function ScoreBreakdown(props: Props) {
  const {
    operatorId,
    isPro,
    auditVerified,
    telemetry,
    pcEstimate,
    pcExact,
    compDisplay,
    ctDisplay,
    sdDisplay,
    ttDisplay,
    signaRate,
    proSlots,
  } = props;
  const [tier, setTier] = useState<Tier>("free");
  const showPro = isPro || tier === "pro";

  const baseRows: ConvRow[] = [
    {
      inputHead: "Your telemetry",
      formula: (
        <>
          Output : fresh input
          <br />
          bounded purity
        </>
      ),
      inputs: <span className="font-semibold text-gold">3.90M / 123K</span>,
      outHead: (
        <>
          COMP · Core 5{" "}
          <CanonId id="M.01" real title="Compression Ratio (M.01)" />
        </>
      ),
      title: "Compression Ratio",
      desc: "Bounded signal-purity. The closer to 1.0, the more output per fresh token.",
      score: <span className="text-gold">{compDisplay}</span>,
      delta: "+0.05 vs 30d",
      pill: { kind: "clean", label: "● Clean" },
      conf: "High confidence",
    },
    {
      inputHead: "Your telemetry",
      formula: (
        <>
          Cache reuse rate
          <br />
          across submissions
        </>
      ),
      inputs: (
        <span className="font-semibold text-gold">
          1.08B reads / 1.12B total
        </span>
      ),
      outHead: (
        <>
          CT · Core 5{" "}
          <CanonId id="M.03" real title="Cross-Thread Referencing (M.03)" />
        </>
      ),
      title: "Cross-Thread Referencing",
      desc: "Continuity persistence across sessions. Cache reuse as the proxy signal.",
      score: ctDisplay,
      delta: "+6 vs 30d",
      pill: { kind: "clean", label: "● Clean" },
      conf: "High confidence",
    },
    {
      inputHead: "Your telemetry",
      formula: (
        <>
          Turn density
          <br />
          per session
        </>
      ),
      inputs: (
        <span className="font-semibold text-gold">
          7,327 turns / 21 sessions
        </span>
      ),
      outHead: (
        <>
          SD · Core 5 <CanonId id="M.04" real title="Session Depth (M.04)" />
        </>
      ),
      title: "Session Depth",
      desc: "Bucketed [0,100]. Turns proxy chains — Pro tier reveals actual reply-chain length.",
      score: sdDisplay,
      delta: "+3.9 vs 30d",
      pill: { kind: "strong", label: "● Strong" },
      conf: "Turns ≠ chains",
    },
    {
      inputHead: "Your telemetry",
      formula: (
        <>
          Log-scaled
          <br />
          output bandwidth
        </>
      ),
      inputs: (
        <span className="font-semibold text-gold">3.90M output tokens</span>
      ),
      outHead: (
        <>
          TT · Core 5 <CanonId id="M.05" real title="Token Throughput (M.05)" />
        </>
      ),
      title: "Token Throughput",
      desc: "Log-scaled bandwidth. Prevents volume gaming while rewarding sustained output.",
      score: ttDisplay,
      delta: "+2.4k vs 30d",
      pill: { kind: "clean", label: "● Direct" },
      conf: "Exact",
    },
  ];

  const pcRowLockedPreview: ConvRow = {
    inputHead: "Conversation analysis",
    formula: (
      <>
        Prompt structure
        <br />
        composite sub-scores
      </>
    ),
    inputs: (
      <span className="text-gold">⊘ Requires sig_army prompt analysis</span>
    ),
    outHead: (
      <>
        PC · Core 5 <CanonId id="M.02" real title="Prompt Complexity (M.02)" />
      </>
    ),
    title: "Prompt Complexity",
    desc: "Structural sophistication of prompts. Raw input volume is NOT a complexity proxy.",
    score: <span className="text-text-dim">~{pcEstimate}</span>,
    pill: { kind: "weak", label: "★ Pro only" },
    conf: "Estimated · sig_army audit",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-bg-border-subtle bg-bg-surface">
      {/* Head + tier toggle */}
      <div className="flex flex-wrap items-center gap-4 border-b border-bg-border-subtle px-7 py-5">
        <div className="min-w-[220px] flex-1">
          <h3 className="mb-1 text-base font-semibold tracking-[-0.015em] text-text-primary">
            How your SIGNA RATE was computed
          </h3>
          <div className="font-mono text-xs text-text-muted">
            30-day window · ruleset v1.0 · ed25519-signed submission
            {auditVerified ? " · audit verified" : ""}
          </div>
        </div>
        <div
          role="group"
          aria-label="Score tier"
          className="flex gap-px rounded-lg border border-bg-border bg-bg-elevated p-0.5"
        >
          <button
            type="button"
            aria-pressed={tier === "free"}
            onClick={() => setTier("free")}
            className={
              "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
              (tier === "free"
                ? "bg-bg-hover text-text-primary"
                : "text-text-secondary")
            }
          >
            Free tier
          </button>
          <button
            type="button"
            aria-pressed={tier === "pro"}
            onClick={() => setTier("pro")}
            className={
              "rounded-md px-3.5 py-1.5 text-[13px] font-medium text-gold transition-colors " +
              (tier === "pro" ? "bg-bg-hover" : "")
            }
          >
            Pro tier (sig_army)
          </button>
        </div>
      </div>

      {/* Telemetry receipts */}
      <TelemetryStrip telemetry={telemetry} />

      {/* Conversion rows */}
      <div>
        {baseRows.map((r, i) => (
          <Row key={i} row={r} />
        ))}

        {/* PC row — upgrade gate removed (owner 2026-06-22, ProGate archived while
            billing is dormant). Shows the estimate preview (the non-Pro view) with no
            upgrade overlay; the exact-value Pro unlock returns with Stripe-live. */}
        <div className="bg-gradient-to-b from-gold/[0.03] to-transparent">
          <Row row={pcRowLockedPreview} />
        </div>
      </div>

      {/* Black-box engine */}
      <BlackBoxEngine
        inputs={[
          { label: "Comp", value: compDisplay },
          { label: "SD", value: sdDisplay },
          {
            label: "PC",
            value: showPro
              ? pcExact != null
                ? String(pcExact)
                : "—"
              : `~${pcEstimate}`,
          },
          { label: "CT", value: ctDisplay },
          { label: "TT", value: ttDisplay },
        ]}
        signaRate={signaRate}
        auditVerified={auditVerified}
      />

      {/* Reserved-but-not-finalized Pro metric slots. */}
      <div className="border-t border-gold/25 bg-gradient-to-b from-gold/[0.04] to-transparent px-7 py-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
          Coming to Pro · not finalized
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {proSlots.map((s) => (
            <div
              key={s.canonId}
              className="rounded-lg border border-bg-border-subtle bg-bg-elevated p-4"
              data-operator-id={operatorId}
            >
              <div className="mb-1 font-mono text-[11px] font-semibold text-gold">
                {s.label}
                <CanonId
                  id={s.canonId}
                  title={`${s.label} (${s.canonId}) — not yet finalized`}
                />
              </div>
              <p className="mb-2 text-[11px] leading-snug text-text-muted">
                {s.desc}
              </p>
              <div className="font-mono text-sm text-text-secondary">
                {s.finalized && s.value != null ? (
                  s.value.toFixed(1)
                ) : (
                  <Placeholder
                    value="Not finalized"
                    title="Reserved Pro metric — not yet finalized"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro upsell */}
      {!isPro && (
        <div className="flex flex-wrap items-center gap-5 border-t border-gold/25 bg-gradient-to-r from-gold/[0.06] to-transparent px-7 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-gold/25 bg-gold/[0.08] text-base text-gold">
            ⊕
          </div>
          <div className="flex-1">
            <h5 className="mb-0.5 text-[13px] font-semibold text-text-primary">
              Unlock exact computation with Signalgeist Pro
            </h5>
            <p className="text-xs leading-snug text-text-muted">
              sig_army replaces the PC estimate with a full sub-score breakdown
              (instruction layers, recursion, system entities, constraint
              density), adds Drift Ratio detection, and earns the Audit Verified
              badge.
            </p>
          </div>
          <a
            href="/wiki"
            className="rounded-md bg-gold px-3.5 py-2 font-sans text-[13px] font-semibold text-bg-base"
          >
            ★ Upgrade — $19/mo
            <span
              className="ph"
              title="OPERATOR_OVERRIDE_REQUIRED PRICE.PRO_MONTHLY"
            >
              ★
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
