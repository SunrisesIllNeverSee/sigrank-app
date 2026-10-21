"use client";

/**
 * SearchOverlay — full-screen site search for phones (the Search tab). Reuses
 * the GlobalSearch index (`/api/search-index`, one fetch per tab) and the same
 * matchers, with a 16px input so iOS does not zoom. Results are a plain list;
 * Up/Down move, Enter opens, Esc/Back/Cancel close.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { matchOperators, matchPages } from "@/lib/search/match";
import { loadIndex, type Item, type SearchIndex } from "../live/GlobalSearch";
import { useDialog } from "./useDialog";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  useDialog(open, onClose, ref);

  useEffect(() => {
    if (!open || index) return;
    loadIndex().then(setIndex).catch(() => setFailed(true));
  }, [open, index]);
  useEffect(() => {
    const t = setTimeout(() => setQuery(value), 120);
    return () => clearTimeout(t);
  }, [value]);

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

  if (!open) return null;

  const go = (it: Item) => {
    router.push(it.href);
    onClose();
  };
  const settled = value === query;
  const hasQuery = value.trim().length > 0;

  return (
    <div ref={ref} className="m-search" role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
      <div className="m-sin" role="search">
        <input
          data-autofocus
          className="m-sinput"
          type="search"
          role="combobox"
          aria-label="Search operators and pages"
          aria-expanded={hasQuery}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
          placeholder="Search operators · pages"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && items.length) {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp" && items.length) {
              e.preventDefault();
              setActive((a) => (a - 1 + items.length) % items.length);
            } else if (e.key === "Enter" && items[active]) {
              e.preventDefault();
              go(items[active]);
            }
          }}
        />
        <button type="button" className="m-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
      <ul id={listId} role="listbox" aria-label="Search results" className="m-sres">
        {(["op", "page"] as const).map((kind) => {
          const group = items.filter((i) => i.kind === kind);
          if (!group.length) return null;
          return (
            <li role="presentation" key={kind}>
              <div className="m-sgh" role="presentation">{kind === "op" ? "Operators" : "Pages"}</div>
              <ul role="presentation">
                {group.map((it) => {
                  const i = items.indexOf(it);
                  return (
                    <li
                      key={it.key}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={"m-sopt" + (i === active ? " on" : "")}
                      onClick={() => go(it)}
                    >
                      <b>{it.label}</b>
                      <small>{it.sub}</small>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
        {hasQuery && items.length === 0 && (
          <li role="presentation" className="m-sempty">
            {failed ? "Search is unavailable right now." : !index || !settled ? "Searching…" : "No matches."}
          </li>
        )}
        {!hasQuery && (
          <li role="presentation" className="m-sempty">
            Type an operator handle, a codename or a page name.
          </li>
        )}
      </ul>
    </div>
  );
}
