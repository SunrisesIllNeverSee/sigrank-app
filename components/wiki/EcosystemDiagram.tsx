/**
 * components/wiki/EcosystemDiagram.tsx — the three-property ecosystem diagram.
 *
 * Shows the progression:
 *   mos2es.org (commercial) → mos2es.com (architecture) → signalaf.com/wiki (evidence)
 *
 * Placed on the wiki hub and individual wiki pages to show how the three
 * properties connect. Server component.
 */

import Link from "next/link";

export function EcosystemDiagram() {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-5">
      <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-text-accent">
        The MO§ES Ecosystem
      </h2>
      <p className="max-w-2xl font-sans text-xs leading-relaxed text-text-muted">
        Three properties, each with a clear job. The progression goes from
        commercial capability to architecture to evidence.
      </p>
      <div className="flex flex-col gap-3 font-mono text-xs">
        <Link
          href="https://mos2es.org"
          className="flex flex-col gap-1 rounded-md border border-bg-border bg-bg-base p-3 transition-colors hover:border-gold/30"
        >
          <span className="font-bold text-text-primary">UPSILON / mos2es.org</span>
          <span className="text-text-muted">Commercial Application</span>
          <span className="text-text-dim">What can I do with this?</span>
        </Link>
        <div className="flex items-center justify-center text-text-dim">
          ↓ 30-Day Enterprise Pilot
        </div>
        <div className="flex gap-3">
          <Link
            href="https://mos2es.org"
            className="flex-1 rounded-md border border-bg-border bg-bg-base p-2 text-center text-text-muted transition-colors hover:border-gold/30"
          >
            Operator / System Measurement
          </Link>
          <span className="flex items-center text-text-dim">↔</span>
          <Link
            href="https://mos2es.org/system-testing"
            className="flex-1 rounded-md border border-bg-border bg-bg-base p-2 text-center text-text-muted transition-colors hover:border-gold/30"
          >
            System Governance Testing
          </Link>
        </div>
        <div className="flex items-center justify-center text-text-dim">↓</div>
        <Link
          href="https://mos2es.com"
          className="flex flex-col gap-1 rounded-md border border-bg-border bg-bg-base p-3 transition-colors hover:border-gold/30"
        >
          <span className="font-bold text-text-primary">MO§ES / mos2es.com</span>
          <span className="text-text-muted">Architecture + Research</span>
          <span className="text-text-dim">How does this architecture work?</span>
        </Link>
        <div className="flex items-center justify-center text-text-dim">↓</div>
        <Link
          href="/wiki"
          className="flex flex-col gap-1 rounded-md border border-bg-border bg-bg-base p-3 transition-colors hover:border-gold/30"
        >
          <span className="font-bold text-text-primary">
            SignalAF Wiki / signalaf.com/wiki
          </span>
          <span className="text-text-muted">Evidence Layer</span>
          <span className="text-text-dim">
            Show me the definitions, tests, data, and evidence
          </span>
        </Link>
        <div className="flex gap-3">
          <span className="flex-1 rounded-md border border-bg-border bg-bg-base p-2 text-center text-text-dim">
            Definitions
          </span>
          <span className="flex-1 rounded-md border border-bg-border bg-bg-base p-2 text-center text-text-dim">
            Tests
          </span>
          <span className="flex-1 rounded-md border border-bg-border bg-bg-base p-2 text-center text-text-dim">
            Results
          </span>
        </div>
      </div>
    </section>
  );
}
