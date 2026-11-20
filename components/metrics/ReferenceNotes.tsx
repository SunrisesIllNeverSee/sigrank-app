import type { ReactNode } from "react";

export interface ReferenceNote {
  label: string;
  body: ReactNode;
}

/**
 * Visible reference-notes block. Carries the evidence, test, falsifier,
 * limitations and lineage text from the retired /wiki/metrics/* entries
 * (2026-11 metrics consolidation), verbatim. Plain visible text only.
 */
export function ReferenceNotes({
  id,
  heading = "Reference notes",
  intro,
  notes,
  headingLevel = 2,
}: {
  id?: string;
  heading?: string;
  intro?: ReactNode;
  notes: ReferenceNote[];
  headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3">
      <H className="font-mono text-base font-bold text-text-primary">{heading}</H>
      {intro && (
        <p className="font-sans text-sm leading-relaxed text-text-secondary">{intro}</p>
      )}
      <dl className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        {notes.map((n) => (
          <div key={n.label} className="flex flex-col gap-1">
            <dt className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
              {n.label}
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">{n.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
