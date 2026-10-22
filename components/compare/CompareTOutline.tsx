"use client";

import { useEffect, useRef, useState } from "react";

/** A SINGLE gold perimeter follows the union of the two operator selectors
 * (T crossbar) and the raised statistics ledger (T stem).
 * Individual rectangular borders left an internal seam, and were not a T.
 *
 * Coordinates are derived from the actual DOM geometry: resizing the workspace
 * rails, changing operator names, or adjusting font zoom cannot drift the frame.
 * Disabled for <=1180px, where the page stacks the ledger below the operators.
 */
export function CompareTOutline() {
  const outline = useRef<SVGSVGElement>(null);
  const [shape, setShape] = useState<{ path: string; width: number; height: number } | null>(null);

  useEffect(() => {
    const svg = outline.current;
    const stage = svg?.closest(".ws-cmp-stage");
    const bar = stage?.querySelector<HTMLElement>(".cmp-stage-head");
    const stem = stage?.querySelector<HTMLElement>(".ws-cmp-ledger");
    if (!stage || !bar || !stem) return;

    let frame = 0;
    const recalculate = () => {
      if (!window.matchMedia("(min-width: 1181px)").matches) {
        setShape(null);
        return;
      }
      const parent = stage.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      const l = stem.getBoundingClientRect();
      if (b.width < 1 || l.width < 1) return;
      const x0 = b.left - parent.left;
      const x1 = l.left - parent.left;
      const x2 = l.right - parent.left;
      const x3 = b.right - parent.left;
      const y0 = Math.min(b.top, l.top) - parent.top;
      const y1 = b.bottom - parent.top;
      const y2 = l.bottom - parent.top;
      // Clamp radii inside the narrow selector arms and the full ledger.
      const r = Math.min(6, (x1-x0)/4, (x3-x2)/4);
      const f = (v: number) => Number(v.toFixed(2));
      const d = [
        `M ${f(x0+r)} ${f(y0)}`,
        `L ${f(x3-r)} ${f(y0)} Q ${f(x3)} ${f(y0)} ${f(x3)} ${f(y0+r)}`,
        `L ${f(x3)} ${f(y1-r)} Q ${f(x3)} ${f(y1)} ${f(x3-r)} ${f(y1)}`,
        `L ${f(x2+r)} ${f(y1)} Q ${f(x2)} ${f(y1)} ${f(x2)} ${f(y1+r)}`,
        `L ${f(x2)} ${f(y2-r)} Q ${f(x2)} ${f(y2)} ${f(x2-r)} ${f(y2)}`,
        `L ${f(x1+r)} ${f(y2)} Q ${f(x1)} ${f(y2)} ${f(x1)} ${f(y2-r)}`,
        `L ${f(x1)} ${f(y1+r)} Q ${f(x1)} ${f(y1)} ${f(x1-r)} ${f(y1)}`,
        `L ${f(x0+r)} ${f(y1)} Q ${f(x0)} ${f(y1)} ${f(x0)} ${f(y1-r)}`,
        `L ${f(x0)} ${f(y0+r)} Q ${f(x0)} ${f(y0)} ${f(x0+r)} ${f(y0)} Z`,
      ].join(" ");
      // Stage may be taller than the view (scroll); SVG follows it all.
      setShape({ path:d, width:Math.max(1, parent.width), height:Math.max(1, parent.height) });
    };
    const queue = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(recalculate);
    };
    const observer = new ResizeObserver(queue);
    observer.observe(stage);
    observer.observe(bar);
    observer.observe(stem);
    window.addEventListener("resize", queue);
    queue();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", queue);
    };
  }, []);

  return (
    <svg ref={outline} className="cmp-t-perimeter" aria-hidden="true"
      viewBox={shape ? `0 0 ${shape.width} ${shape.height}` : "0 0 1 1"}
      preserveAspectRatio="none">
      {shape && <path d={shape.path} className="cmp-t-perimeter-path" />}
    </svg>
  );
}
