"use client";

/**
 * components/compare/OperatorSearchSelect.tsx — searchable operator combobox.
 *
 * Replaces the flat <select> that was capped at 500 operators (owner 2026-07-16:
 * "it only shows 500 operators in the drop down... it needs to have a search bar
 * for all"). Now loads ALL operators and filters client-side with a search input.
 *
 * Behaviour:
 *   - Click the input → dropdown opens with all operators (alphabetical)
 *   - Type to filter by codename or display label (case-insensitive)
 *   - Arrow keys to navigate, Enter to select, Esc to close
 *   - Selecting navigates to /compare?a=...&b=... (same as the old <select>)
 *   - Click outside closes the dropdown
 *   - Shows "No operators found" when the filter matches nothing
 */

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";

export interface CompareOption {
  codename: string;
  label: string;
}

export function OperatorSearchSelect({
  options,
  selectedCode,
  onSelect,
  sideLabel,
  disabledCode,
}: {
  options: CompareOption[];
  selectedCode: string;
  onSelect: (code: string) => void;
  sideLabel: string;
  disabledCode?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the currently selected label for display when closed
  const selectedLabel = useMemo(
    () => options.find((o) => o.codename === selectedCode)?.label ?? selectedCode,
    [options, selectedCode],
  );

  // Filtered options based on search query
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.codename.toLowerCase().includes(q),
    );
  }, [options, query]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onSelect(code);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIndex]) {
        handleSelect(filtered[highlightIndex].codename);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  // Scroll highlighted item into view
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
        {sideLabel}
      </span>
      <div className="relative">
        {/* Closed state: shows selected operator as a button */}
        {!open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2 text-left font-mono text-sm text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
          >
            {selectedLabel}
          </button>
        )}

        {/* Open state: search input + dropdown */}
        {open && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search operators…"
              className="w-full rounded-md border border-text-accent bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-dim"
              autoFocus
            />
            <div
              ref={listRef}
              className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-bg-border bg-bg-surface shadow-lg"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 font-mono text-xs text-text-muted">
                  No operators found
                </div>
              ) : (
                filtered.map((o, i) => (
                  <button
                    key={o.codename}
                    type="button"
                    onClick={() => handleSelect(o.codename)}
                    onMouseEnter={() => setHighlightIndex(i)}
                    disabled={o.codename === disabledCode}
                    className={`block w-full px-3 py-1.5 text-left font-mono text-sm transition-colors ${
                      i === highlightIndex
                        ? "bg-bg-hover text-text-primary"
                        : "text-text-secondary hover:bg-bg-hover"
                    } ${o.codename === disabledCode ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {o.label}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
