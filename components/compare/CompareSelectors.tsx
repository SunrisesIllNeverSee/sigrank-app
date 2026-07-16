"use client";

/**
 * components/compare/CompareSelectors.tsx — the two opponent pickers (owner 2026-06-22:
 * "add two search/dropdown boxes to select who to compare against").
 *
 * Owner 2026-07-16: replaced flat <select> (capped at 500) with searchable combobox
 * (OperatorSearchSelect) so ALL operators are searchable, not just the top 500.
 *
 * Two searchable comboboxes (operator A vs operator B) that navigate to
 * /compare?a=<codename>&b=<codename>. Client island; the RSC page reads the params
 * back and re-resolves both rows. Picking the same operator on both sides is guarded
 * (the disabled option prevents it). Sits inside the matchup poster header area.
 */

import { useRouter } from "next/navigation";
import { OperatorSearchSelect, type CompareOption } from "./OperatorSearchSelect";

export type { CompareOption };

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
      <OperatorSearchSelect
        options={options}
        selectedCode={aCode}
        onSelect={(code) => go(code, bCode)}
        sideLabel="Operator A"
        disabledCode={bCode}
      />

      <span className="pb-2 text-center font-mono text-xs text-text-muted">
        vs
      </span>

      <OperatorSearchSelect
        options={options}
        selectedCode={bCode}
        onSelect={(code) => go(aCode, code)}
        sideLabel="Operator B"
        disabledCode={aCode}
      />
    </div>
  );
}
