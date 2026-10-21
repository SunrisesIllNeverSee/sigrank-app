"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * PcardFit — scales the fixed 324x484 passport card to its container so it is
 * never cropped on narrow screens (owner 2026-10-21, phone <= 760px). When the
 * container is at least 324px wide the scale is 1 and nothing changes, so
 * desktop layout is identical to the unwrapped card.
 */
const W = 324;
const H = 484;

export function PcardFit({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, Math.max(0.5, el.clientWidth / W)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className="pv2-pcard-fit" style={{ width: "100%", maxWidth: W, height: H * scale }}>
      <div style={{ width: W, height: H, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
