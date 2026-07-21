"use client";

/**
 * BoardCapture — screenshot capture for the leaderboard table.
 *
 * Captures the current page of 25 rows (whatever filters/sort/page are active)
 * as a PNG. Adds a timestamp + filter summary overlay at the top of the image
 * so screenshots are self-documenting when shared on social media.
 *
 * Two actions:
 *  - Download PNG: saves to disk via <a download>
 *  - Copy to clipboard: writes PNG blob to navigator.clipboard
 *
 * Uses html-to-image (already in deps for SplitFlapCard). The overlay is
 * rendered as a temporary DOM node appended above the target element during
 * capture, then removed.
 */

import React, { useCallback, useRef, useState } from "react";
import { track } from "@/lib/infra/posthog/events";

interface BoardCaptureProps {
  /** The table container element to capture. */
  targetRef: React.RefObject<HTMLDivElement | null>;
  /** Active filter state for the overlay label. */
  filters: {
    window: string;
    platform: string;
    view: string;
    classFilter: string;
    category: string;
    sort: string;
    page: number;
    totalPages: number;
  };
}

type CaptureMode = "download" | "clipboard";

export function BoardCapture({ targetRef, filters }: BoardCaptureProps) {
  const [busy, setBusy] = useState<CaptureMode | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const buildOverlay = useCallback(() => {
    const now = new Date();
    const ts = now.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });

    const parts: string[] = [`Window: ${filters.window}`];
    if (filters.platform && filters.platform !== "All")
      parts.push(`Platform: ${filters.platform}`);
    if (filters.classFilter && filters.classFilter !== "all")
      parts.push(`Class: ${filters.classFilter}`);
    if (filters.category && filters.category !== "all")
      parts.push(`Category: ${filters.category}`);
    if (filters.view && filters.view !== "metrics")
      parts.push(`View: ${filters.view}`);
    if (filters.sort && filters.sort !== "yield")
      parts.push(`Sort: ${filters.sort}`);
    if (filters.totalPages > 1)
      parts.push(`Page ${filters.page + 1}/${filters.totalPages}`);

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 20px;
      background: rgb(var(--bg-surface));
      border-bottom: 1px solid rgb(var(--bg-border));
      font-family: Roboto, -apple-system, system-ui, sans-serif;
      font-size: 13px;
      color: rgb(var(--text-primary));
      white-space: nowrap;
    `;
    overlay.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;font-weight:700;">
        <span style="color:rgb(var(--gold));font-size:16px;">SigRank</span>
        <span style="color:rgb(var(--text-muted));font-weight:400;">— Leaderboard Snapshot</span>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;color:rgb(var(--text-muted));font-size:11px;">
        ${parts.map((p) => `<span style="padding:2px 8px;border:1px solid rgb(var(--bg-border));border-radius:4px;">${p}</span>`).join("")}
      </div>
      <div style="color:rgb(var(--text-muted));font-size:11px;font-variant-numeric:tabular-nums;">${ts}</div>
    `;
    return overlay;
  }, [filters]);

  const capture = useCallback(
    async (mode: CaptureMode) => {
      const target = targetRef.current;
      if (!target) return;
      setBusy(mode);
      try {
        const { toPng } = await import("html-to-image");

        // Insert overlay above the table for the capture
        const overlay = buildOverlay();
        target.parentElement?.insertBefore(overlay, target);
        overlayRef.current = overlay;

        // Capture the overlay + table together by wrapping them in a temp container
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display:flex;flex-direction:column;";
        target.parentElement?.insertBefore(wrapper, overlay);
        wrapper.appendChild(overlay);
        wrapper.appendChild(target);

        const dataUrl = await toPng(wrapper, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "rgb(var(--bg-base))",
        });

        // Restore DOM order
        wrapper.removeChild(overlay);
        wrapper.removeChild(target);
        target.parentElement?.insertBefore(target, wrapper);
        wrapper.remove();
        overlay.remove();
        overlayRef.current = null;

        if (mode === "download") {
          const a = document.createElement("a");
          a.href = dataUrl;
          const slug = filters.window.replace(/[^a-z0-9]/gi, "-").toLowerCase();
          a.download = `sigrank-board-${slug}-p${filters.page + 1}.png`;
          a.click();
        } else {
          // Convert data URL to blob for clipboard
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
        }
        track.boardShared(mode, {
          window: filters.window,
          platform: filters.platform,
          sort: filters.sort,
          page: filters.page + 1,
        });
      } catch (err) {
        console.error("BoardCapture failed:", err);
      } finally {
        setBusy(null);
      }
    },
    [targetRef, buildOverlay, filters],
  );

  const btn =
    "rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => capture("download")}
        disabled={busy !== null}
        className={btn}
        title="Download a PNG screenshot of the current leaderboard page"
      >
        {busy === "download" ? "Rendering\u2026" : "\u2b07 Screenshot"}
      </button>
      <button
        type="button"
        onClick={() => capture("clipboard")}
        disabled={busy !== null}
        className={btn}
        title="Copy a PNG screenshot to clipboard for pasting into tweets/posts"
      >
        {busy === "clipboard" ? "Rendering\u2026" : "\u2398 Copy"}
      </button>
    </div>
  );
}
