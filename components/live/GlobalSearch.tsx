"use client";

/**
 * GlobalSearch — site-wide search at the right end of the page-title row
 * (owner 2026-10-21: "the site search is supposed to sit in the title bar
 * where it's not affected by collapsing the sidebar"). Searches every
 * operator (public fields only) and the whole site's page index; results
 * drop down grouped Operators / Pages. Up/Down move, Enter opens, Esc closes.
 * The index is fetched once, lazily, on first focus (GET /api/search-index).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  matchOperators,
  matchPages,
  type SearchOperator,
  type SearchPage,
} from "@/lib/search/match";

interface SearchIndex {
  operators: SearchOperator[];
  pages: SearchPage[];
}

// Module-level cache: one fetch per tab, shared across shell remounts.
let indexPromise: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/api/search-index")
      .then((r) => (r.ok ? (r.json() as Promise<SearchIndex>) : Promise.reject(new Error(String(r.status)))))
      .catch((e) => {
        indexPromise = null; // allow a retry on next focus
        throw e;
      });
  }
  return indexPromise;
}

type Item =
  | { kind: "op"; key: string; label: string; sub: string; href: string }
  | { kind: "page"; key: string; label: string; sub: string; href: string };

const DEBOUNCE_MS = 120;

export function GlobalSearch({ label = "Search" }: { label?: string }) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);

  const ensureIndex = useCallback(() => {
    if (index) return;
    loadIndex().then(setIndex).catch(() => setFailed(true));
  }, [index]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const items = useMemo<Item[]>(() => {
    if (!index || !query.trim()) return [];
    const ops: Item[] = matchOperators(index.operators, query).map((o) => ({
      kind: "op",
      key: `op:${o.codename}`,
      label: o.name,
      sub: [o.handle, o.klass].filter(Boolean).join(" · "),
      href: `/user/${encodeURIComponent(o.codename)}`,
    }));
    const pgs: Item[] = matchPages(index.pages, query).map((p) => ({
      kind: "page",
      key: `pg:${p.path}`,
      label: p.title,
      sub: p.section,
      href: p.path,
    }));
    return [...ops, ...pgs];
  }, [index, query]);

  useEffect(() => setActive(0), [items]);

  const go = (it: Item) => {
    setOpen(false);
    setValue("");
    setQuery("");
    router.push(it.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (items.length) setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      if (open && items[active]) {
        e.preventDefault();
        go(items[active]);
      }
    } else if (e.key === "Escape") {
      if (open) e.stopPropagation();
      setOpen(false);
      if (!value) inputRef.current?.blur();
    }
  };

  const showPanel = open && value.trim().length > 0;
  const settled = value === query;
  const opItems = items.filter((i) => i.kind === "op");
  const pageItems = items.filter((i) => i.kind === "page");

  const renderGroup = (title: string, group: Item[]) =>
    group.length > 0 && (
      <li role="presentation" className="gs-group" key={title}>
        <div className="gs-gh" role="presentation">{title}</div>
        <ul role="presentation">
          {group.map((it) => {
            const i = items.indexOf(it);
            return (
              <li
                key={it.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={"gs-opt" + (i === active ? " on" : "")}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(it)}
              >
                <span className="gs-l">{it.label}</span>
                <span className="gs-s">{it.sub}</span>
              </li>
            );
          })}
        </ul>
      </li>
    );

  return (
    <div className="gs-root" ref={rootRef} role="search">
      <input
        ref={inputRef}
        className="gs-in"
        type="search"
        role="combobox"
        aria-label={label}
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && items[active] ? `${listId}-${active}` : undefined}
        placeholder="SEARCH OPERATORS · PAGES"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          ensureIndex();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showPanel && (
        <ul id={listId} role="listbox" aria-label={`${label} results`} className="gs-panel">
          {renderGroup("Operators", opItems)}
          {renderGroup("Pages", pageItems)}
          {items.length === 0 && (
            <li role="presentation" className="gs-empty">
              {failed
                ? "Search is unavailable right now."
                : !index || !settled
                  ? "Searching…"
                  : "No matches."}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
