"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { signInWithGitHub, signOut } from "@/lib/infra/supabase/auth";

/**
 * AccountMenu — right-side account / profile entry point.
 *
 * Auth state resolves CLIENT-SIDE via GET /api/auth/session (cache:no-store) so the
 * board and every other page stay statically renderable — the nav never reads cookies
 * server-side just to show a menu (AUTH_LAUNCH_DIRECTIVES D2). Logged out → a "Log in"
 * trigger (Continue with GitHub inline, or "Other ways" → /login for magic-link + X).
 * Logged in → avatar + display name, with My Profile / Settings / Sign out.
 *
 * Positioning (fix 2026-06-25): the panel renders via a PORTAL to document.body with
 * position:fixed, anchored under the trigger — the sticky `backdrop-blur` nav is a
 * containing block for absolute children, which made the old `absolute mt-2` panel drop
 * UPWARD and clip off-screen. A fixed portal escapes the nav's containing block.
 */
interface SessionOperator {
  codename: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [operator, setOperator] = useState<SessionOperator | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  // Resolve the signed-in operator (public display fields only — no PII).
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (!alive) return;
        setOperator((d?.operator as SessionOperator | null) ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Anchor the fixed panel under the trigger (right-aligned). Recompute on open, and on
  // resize/scroll while open so it tracks the sticky nav.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      const inRoot = rootRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inRoot && !inMenu) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onGitHub() {
    setBusy(true);
    const { error } = await signInWithGitHub();
    if (error) setBusy(false);
    // success → the page unloads into GitHub's OAuth screen
  }

  async function onSignOut() {
    await signOut();
    setOpen(false);
    setOperator(null);
    router.refresh();
  }

  const itemCls =
    "block rounded px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary";
  const displayName = operator
    ? operator.displayName || operator.codename
    : null;

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      {/* Get ranked — primary conversion CTA (logged-out only; hidden once signed in). */}
      {loaded && !operator && (
        <Link
          href="/login"
          className="rounded-md bg-gold px-3 py-1.5 font-sans text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Get ranked →
        </Link>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-bg-border bg-bg-elevated px-2.5 py-1.5 font-sans text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
      >
        {operator ? (
          <>
            {operator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={operator.avatarUrl}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <span className="text-gold">◎</span>
            )}
            <span className="max-w-[10rem] truncate text-text-primary">
              {displayName}
            </span>
          </>
        ) : (
          <>
            <span className="text-gold">◎</span> Log in
          </>
        )}
      </button>

      {open &&
        pos !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Account"
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-50 w-56 rounded-md border border-bg-border bg-bg-elevated p-1 font-sans text-sm shadow-lg"
          >
            {operator ? (
              <>
                <Link
                  href="/me"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemCls}
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemCls}
                >
                  Settings
                </Link>
                <div className="my-1 border-t border-bg-border" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className={`w-full text-left ${itemCls}`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onGitHub}
                  disabled={busy}
                  className={`w-full text-left disabled:cursor-not-allowed disabled:opacity-60 ${itemCls}`}
                >
                  {busy ? "Connecting…" : "Continue with GitHub"}
                </button>
                <Link
                  href="/login"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemCls}
                >
                  Other ways to sign in →
                </Link>
              </>
            )}

            <div className="my-1 border-t border-bg-border" />

            <Link
              href="/wiki#contact"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={itemCls}
            >
              Contact
            </Link>

            <div className="my-1 border-t border-bg-border" />

            <div className="px-2.5 py-1.5">
              <div className="mb-1.5 font-mono text-[11px] uppercase tracking-tight text-text-muted">
                Theme
              </div>
              <ThemeToggle />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
