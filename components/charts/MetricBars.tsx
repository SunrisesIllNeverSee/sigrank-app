import { Placeholder } from "@/components/ui/Placeholder";

/**
 * MetricBars — ranked horizontal bar chart for a single metric (the classic
 * leaderboard visual). Div-based (width %), so it's responsive and themes
 * natively via CSS-var Tailwind classes. Pure presentational server component.
 * Bars normalize to the max value in the set; every metric here is higher-better.
 */

export interface BarItem {
  label: string;
  value: number;
  /** Pre-formatted display value (already carries '~' for low-confidence). */
  formatted: string;
  isPlaceholder?: boolean;
}

interface Props {
  items: BarItem[];
}

export function MetricBars({ items }: Props) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.value), 0) || 1;

  return (
    <div className="flex flex-col gap-2 border-b border-bg-border px-4 py-4">
      {items.map((it, i) => {
        const pct = Math.max(2, Math.min(100, (it.value / max) * 100));
        return (
          <div key={`${it.label}-${i}`} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-right font-mono text-[11px] text-text-muted">
              {i + 1}
            </span>
            <span
              className="w-28 shrink-0 truncate font-mono text-xs text-text-secondary sm:w-36"
              title={it.label}
            >
              {it.label}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-bg-elevated">
              <div
                className="absolute inset-y-0 left-0 rounded bg-gold/80"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold text-text-primary">
              {it.isPlaceholder ? (
                <Placeholder value={it.formatted} />
              ) : (
                it.formatted
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
