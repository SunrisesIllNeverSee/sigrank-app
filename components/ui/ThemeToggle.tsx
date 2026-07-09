"use client";

import { useEffect, useState } from "react";
import { THEMES, type ThemeId, getCurrentTheme, applyTheme } from "@/lib/theme";

/**
 * ThemeToggle — sharp segmented theme switcher. Sets data-theme on <html> and
 * persists to localStorage (read back by the no-flash init in layout.tsx).
 * Initializes from whatever the init script already applied to avoid a flash.
 * Theme logic lives in @/lib/theme so the Shift+T shortcut stays in sync.
 */

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeId>("terminal");

  useEffect(() => {
    setTheme(getCurrentTheme());
  }, []);

  function select(id: ThemeId) {
    applyTheme(id);
    setTheme(id);
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="grid grid-cols-2 gap-0.5 rounded-md border border-bg-border bg-bg-elevated p-0.5"
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={theme === t.id}
          onClick={() => select(t.id)}
          className={
            "rounded px-2 py-1 font-mono text-[11px] tracking-tight transition-colors " +
            (theme === t.id
              ? "bg-bg-hover text-text-primary"
              : "text-text-muted hover:text-text-secondary")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
