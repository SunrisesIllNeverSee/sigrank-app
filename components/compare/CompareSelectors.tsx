"use client";

/**
 * components/compare/CompareSelectors.tsx — the two opponent pickers (owner 2026-06-22:
 * "add two search/dropdown boxes to select who to compare against").
 *
 * Two <select> dropdowns (operator A vs operator B) that navigate to
 * /compare?a=<codename>&b=<codename>. Client island; the RSC page reads the params
 * back and re-resolves both rows. Picking the same operator on both sides is guarded
 * (the page already de-dupes B). Sits inside the matchup poster header area.
 */

import { useRouter } from "next/navigation";

export interface CompareOption {
  codename: string;
  label: string;
}

export function CompareSelectors({
  options,
  aCode,
  bCode,
}: {
  options: CompareOption[];
  aCode: string;
  bCode: string;
}) {
  const router = useRouter();

  const go = (a: string, b: string) => {
    router.push(
      `/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
    );
  };

  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <label className="flex flex-col gap-1">
        <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
          Operator A
        </span>
        <select
          aria-label="Choose operator A"
          value={aCode}
          onChange={(e) => go(e.target.value, bCode)}
          className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
        >
          {options.map((o) => (
            <option
              key={`a-${o.codename}`}
              value={o.codename}
              disabled={o.codename === bCode}
            >
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <span className="pb-2 text-center font-mono text-xs text-text-muted">
        vs
      </span>

      <label className="flex flex-col gap-1">
        <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted sm:text-right">
          Operator B
        </span>
        <select
          aria-label="Choose operator B"
          value={bCode}
          onChange={(e) => go(aCode, e.target.value)}
          className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
        >
          {options.map((o) => (
            <option
              key={`b-${o.codename}`}
              value={o.codename}
              disabled={o.codename === aCode}
            >
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
