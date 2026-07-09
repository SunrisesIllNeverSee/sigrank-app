"use client";

import { useEffect } from "react";
import { getCurrentTheme, nextTheme, applyTheme } from "@/lib/theme";

/**
 * ThemeCycleShortcut — global Shift+T listener that cycles through the four
 * themes (Carbon → Paper → Railway → Terminal → Carbon …). Mounted once in the
 * root layout so it's active on every page.
 *
 * Guards: ignored when focus is inside an input/textarea/contenteditable (so
 * typing a codename into /score or a search field never swaps the theme) and
 * when a modifier beyond Shift is held (no collision with Cmd/Ctrl+Shift+T
 * browser shortcuts). Shift+T is otherwise unclaimed by the browser.
 */
export function ThemeCycleShortcut() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "T" && e.key !== "t") return;
      // Require Shift, forbid any other modifier (Cmd/Ctrl/Alt/Meta).
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      )
        return;
      e.preventDefault();
      applyTheme(nextTheme(getCurrentTheme()));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
