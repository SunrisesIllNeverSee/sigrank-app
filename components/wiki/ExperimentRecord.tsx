/**
 * components/wiki/ExperimentRecord.tsx — the experimental record format template.
 *
 * Every experiment documented on signalaf.com/wiki follows this format. It
 * enforces a consistent structure for reporting experimental results: the
 * exact prompt, what happened, the measurements, the interpretation, the
 * alternative explanation, and the falsifier / next test.
 *
 * This is the Phase 1 foundation for the evidence layer — the format that
 * every experiment record follows, whether it appears inside a wiki entry's
 * Evidence section or as a standalone experiment page.
 *
 * Server component.
 */

import React from "react";

export interface ExperimentRecordProps {
  /** Unique experiment identifier (e.g. EXP-001, EXP-MOSES-CLAW-01). */
  experimentId: string;
  /** The AI system and version tested (e.g. "Claude 3.5 Sonnet", "GPT-4o"). */
  system: string;
  /** The framework name and version (e.g. "MO§ES v0.4", "SigRank Standard v1.0"). */
  framework: string;
  /** The test name being run (e.g. "Lineage preservation under summarization"). */
  test: string;
  /** The exact prompt or input given to the system. */
  input: React.ReactNode;
  /** What happened — a factual description of the system's behavior. */
  observed: React.ReactNode;
  /** The measurements taken (numeric or structured results). */
  result: React.ReactNode;
  /** What the result means — the interpretation. */
  interpretation: React.ReactNode;
  /** An alternative explanation for the result (confound). */
  alternativeExplanation: React.ReactNode;
  /** What would disprove the interpretation, or the next test to run. */
  falsifierOrNextTest: React.ReactNode;
}

/**
 * Renders an experiment record in the standardized format:
 *
 *   EXPERIMENT ID: <ID>
 *   SYSTEM: <model/version>
 *   FRAMEWORK: <name/version>
 *   TEST: <test name>
 *   INPUT: <exact prompt>
 *   OBSERVED: <what happened>
 *   RESULT: <measurements>
 *   INTERPRETATION: <what it means>
 *   ALTERNATIVE EXPLANATION: <confound>
 *   FALSIFIER / NEXT TEST: <what would disprove it>
 */
export function ExperimentRecord({
  experimentId,
  system,
  framework,
  test,
  input,
  observed,
  result,
  interpretation,
  alternativeExplanation,
  falsifierOrNextTest,
}: ExperimentRecordProps) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "EXPERIMENT ID", value: experimentId },
    { label: "SYSTEM", value: system },
    { label: "FRAMEWORK", value: framework },
    { label: "TEST", value: test },
    { label: "INPUT", value: input },
    { label: "OBSERVED", value: observed },
    { label: "RESULT", value: result },
    { label: "INTERPRETATION", value: interpretation },
    { label: "ALTERNATIVE EXPLANATION", value: alternativeExplanation },
    { label: "FALSIFIER / NEXT TEST", value: falsifierOrNextTest },
  ];

  return (
    <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-text-accent">
              {row.label}
            </span>
            <div className="font-sans text-sm leading-relaxed text-text-secondary">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
