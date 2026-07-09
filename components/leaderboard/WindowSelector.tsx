"use client";

/**
 * components/leaderboard/WindowSelector.tsx
 *
 * Window picker (CANON T.12 / D16). Renders the WINDOW_UI labels
 * (Daily / 30 / 60 / 90 / All time) as a segmented control. The selected window
 * is driven by props from the RSC page (which reads `searchParams`); changing it
 * pushes a new `window=<label>` query param. Default is WINDOW_DEFAULT ('30').
 *
 * D16: '60' has no dedicated DB enum and maps to 30d at the API layer
 * (WINDOW_API_MAP); a visible TODO note surfaces that fallback near the board.
 */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WINDOW_UI, WINDOW_DEFAULT, type WindowUI } from "@/lib/constants";

interface Props {
  /** Currently-selected window label (resolved by the page from searchParams). */
  value: WindowUI;
}

export function WindowSelector({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = useCallback(
    (next: WindowUI) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === WINDOW_DEFAULT) params.delete("window");
      else params.set("window", next);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
        Window
      </span>
      <div
        role="group"
        aria-label="Scoring window"
        className="inline-flex overflow-hidden rounded-md border border-bg-border"
      >
        {WINDOW_UI.map((label) => {
          const active = label === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => select(label)}
              className={
                "px-3 py-1.5 font-mono text-xs transition-colors " +
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
