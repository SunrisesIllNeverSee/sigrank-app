/**
 * FieldStatCards — 4 stat cards showing the field medians.
 *
 * Not a chart — styled divs in a responsive grid. Each card shows one median
 * metric with its symbol, value, and a one-line description. Pure Tailwind,
 * no SVG, no dependencies.
 */

interface StatCard {
  symbol: string;
  label: string;
  value: string;
  description: string;
  color: string;
}

export interface FieldStatCardsProps {
  medians: {
    yield: number;
    snr: number;
    leverage: number;
    tokens_per_day: number;
  };
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

export default function FieldStatCards({ medians }: FieldStatCardsProps) {
  const cards: StatCard[] = [
    {
      symbol: "Υ",
      label: "Median Yield",
      value: medians.yield.toFixed(2),
      description: "Token-cascade efficiency — cache compounding per input token",
      color: "#c4923a",
    },
    {
      symbol: "SNR",
      label: "Median Signal-to-Noise",
      value: `${(medians.snr * 100).toFixed(2)}%`,
      description: "Output fraction of total token spend",
      color: "#10b981",
    },
    {
      symbol: "L",
      label: "Median Leverage",
      value: `${medians.leverage.toFixed(2)}×`,
      description: "Cache-read amplification over raw input",
      color: "#8b5cf6",
    },
    {
      symbol: "T/d",
      label: "Median Tokens/Day",
      value: fmtTokens(medians.tokens_per_day),
      description: "Daily token throughput across active operators",
      color: "#5b6472",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-lg border border-bg-border bg-bg-surface p-4"
        >
          <div
            className="font-mono text-2xl font-bold"
            style={{ color: c.color }}
          >
            {c.symbol}
          </div>
          <div className="mt-1 font-sans text-sm text-text-secondary">
            {c.label}
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-text-primary">
            {c.value}
          </div>
          <div className="mt-2 font-sans text-xs leading-relaxed text-text-muted">
            {c.description}
          </div>
        </div>
      ))}
    </div>
  );
}
