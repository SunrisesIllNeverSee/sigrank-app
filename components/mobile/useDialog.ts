"use client";

/**
 * components/mobile/useDialog.ts — shared modal behavior for Drawer, Sheet and
 * SearchOverlay (owner 2026-10-21 mobile foundation): focus moves in on open,
 * Tab is trapped inside, Esc closes, the browser/Android Back button closes
 * (one throw-away history entry), and focus returns to the opener on close.
 */
import { useEffect, useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useDialog(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    const opener = document.activeElement as HTMLElement | null;

    // Back button: same state object + URL, so Next's router ignores the entry.
    const startHref = window.location.href;
    let pushed = false;
    let popped = false;
    let backIssued = false;
    try {
      window.history.pushState(window.history.state, "", startHref);
      pushed = true;
    } catch {
      /* history unavailable — Esc and the scrim still close */
    }
    const onPop = () => {
      popped = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);

    // A link tap inside the dialog: unwind our history entry first, then
    // navigate, so Back from the next page does not land on a duplicate of this one.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (
        !a || !pushed || backIssued || e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        (a.target && a.target !== "_self") || a.hasAttribute("download") || a.origin !== window.location.origin
      ) return;
      e.preventDefault();
      backIssued = true;
      const href = a.pathname + a.search + a.hash;
      const go = () => {
        window.removeEventListener("popstate", go);
        routerRef.current.push(href);
      };
      window.addEventListener("popstate", go);
      window.history.back();
    };
    el?.addEventListener("click", onClick);

    // Focus the first control (or the dialog itself) once it is painted.
    const raf = requestAnimationFrame(() => {
      if (el?.contains(document.activeElement) && document.activeElement !== el) return; // content already took focus
      const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el)?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      el?.removeEventListener("click", onClick);
      // Closed by Esc/scrim (not Back) and still on the same page: drop our entry.
      // After a link navigation the href differs, so the new page is left alone.
      if (pushed && !popped && !backIssued && window.location.href === startHref) window.history.back();
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, ref]);
}
