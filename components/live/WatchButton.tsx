"use client";
/**
 * components/live/WatchButton.tsx — the WATCH toggle, shared by the
 * peek rail and the operator profile module.
 *
 * Two honest tiers: signed-in → a real operator_watches row via
 * /api/v1/operators/<codename>/watch (button carries the live count);
 * signed-out → a localStorage pin on this device, tooltipped as
 * device-local — never presented as a public count.
 */
import { useCallback, useEffect, useState } from "react";
import { useBoardSession } from "./session";

const WATCH_KEY = "sigrank:watch";
const readWatch = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(WATCH_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export function WatchButton({ codename }: { codename: string }) {
  const session = useBoardSession();
  const [local, setLocal] = useState<string[]>([]);
  const [watching, setWatching] = useState<boolean | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setLocal(readWatch());
    if (!session.signedIn) return;
    let alive = true;
    fetch(`/api/v1/operators/${encodeURIComponent(codename)}/watch`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        setWatching(!!d.watching);
        setCount(typeof d.count === "number" ? d.count : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [codename, session.signedIn]);

  const on = watching ?? local.includes(codename);
  const toggle = useCallback(() => {
    if (session.signedIn) {
      fetch(`/api/v1/operators/${encodeURIComponent(codename)}/watch`, {
        method: "POST",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setWatching(!!d.watching);
          setCount(typeof d.count === "number" ? d.count : null);
        })
        .catch(() => {});
      return;
    }
    setLocal((w) => {
      const next = w.includes(codename)
        ? w.filter((c) => c !== codename)
        : [...w, codename];
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      } catch {
        /* private mode — the in-memory toggle still works */
      }
      return next;
    });
  }, [codename, session.signedIn]);

  return (
    <button
      type="button"
      className={`pkbtn${on ? " on" : ""}`}
      aria-pressed={on}
      title={
        session.signedIn
          ? "watch this operator — they can see the count"
          : "pin to your local watchlist (this device — sign in to make it real)"
      }
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
    >
      {on ? "★ WATCHING" : "☆ WATCH"}
      {count ? ` · ${count}` : ""}
    </button>
  );
}
