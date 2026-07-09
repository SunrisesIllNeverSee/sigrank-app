"use client";

/**
 * components/leaderboard/PlatformSelector.tsx
 *
 * Platform filter (CANON T.15). Renders the PLATFORM_UI labels
 * (All / Claude / ChatGPT / Gemini / Pi / Multi) as a segmented control.
 * Selection is driven by props from the RSC page (which reads `searchParams`);
 * changing it pushes a `platform=<label>` query param. Default is
 * PLATFORM_DEFAULT ('All'), which clears the filter.
 */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  type PlatformUI,
} from "@/lib/constants";

interface Props {
  /** Currently-selected platform label (resolved by the page from searchParams). */
  value: PlatformUI;
}

export function PlatformSelector({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = useCallback(
    (next: PlatformUI) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === PLATFORM_DEFAULT) params.delete("platform");
      else params.set("platform", next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
        Platform
      </span>
      <div
        role="group"
        aria-label="Platform filter"
        className="inline-flex flex-wrap overflow-hidden rounded-md border border-bg-border"
      >
        {PLATFORM_UI.map((label) => {
          const active = label === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => select(label)}
              className={
                "px-3 py-1.5 font-sans text-xs transition-colors " +
                (active
                  ? "bg-text-accent/15 text-text-accent"
                  : "bg-bg-surface text-text-secondary hover:bg-bg-hover hover:text-text-primary")
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
