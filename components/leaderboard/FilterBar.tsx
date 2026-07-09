"use client";

/**
 * components/leaderboard/FilterBar.tsx
 *
 * The /operators control strip. Composes PlatformSelector + WindowSelector +
 * ClassFilter and adds a Sort <select> driven by SORT_METRICS. All four controls
 * are URL-state driven: the RSC page reads `searchParams`, resolves the current
 * values, and passes them in; each control pushes its own query param on change.
 *
 * Sort keys (SORT_METRICS): Yield / SIGNA RATE / Compression / Prompt Complexity /
 * Cross-Thread / Session Depth / Message Volume / Signal Force.
 * The default sort key (SORT_DEFAULT = 'yield_') drops the param.
 */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SORT_METRICS,
  SORT_DEFAULT,
  type PlatformUI,
  type WindowUI,
} from "@/lib/constants";
import { PlatformSelector } from "./PlatformSelector";
import { WindowSelector } from "./WindowSelector";
import { ClassFilter } from "./ClassFilter";

interface Props {
  /** Resolved platform label (from searchParams). */
  platform: PlatformUI;
  /** Resolved window label (from searchParams). */
  window: WindowUI;
  /** Resolved lowercase class scope id (from searchParams). */
  classScope: string;
  /** Resolved sort key (a metric_snapshots column; from searchParams). */
  sort: string;
}

export function FilterBar({ platform, window, classScope, sort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSort = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === SORT_DEFAULT) params.delete("sort");
      else params.set("sort", next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
      <PlatformSelector value={platform} />
      <WindowSelector value={window} />
      <ClassFilter value={classScope} />
      <label className="flex flex-col gap-1">
        <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
          Sort by
        </span>
        <select
          aria-label="Sort metric"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          className="rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-sans text-xs text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
        >
          {SORT_METRICS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
