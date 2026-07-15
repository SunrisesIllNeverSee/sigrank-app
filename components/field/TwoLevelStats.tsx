/**
 * TwoLevelStats — Quick View (default) + expandable Statistical Details.
 *
 * Shows the field medians at a glance, with a collapsible section for the
 * full statistical breakdown (IQR, skewness, kurtosis, variance, Benford
 * chi-square). Uses a client-side toggle via <details> for zero-JS
 * interactivity.
 */

export interface TwoLevelStatsProps {
  medians: {
    yield: number;
    snr: number;
    leverage: number;
    velocity: number;
    total_tokens: number;
    tokens_per_day: number;
    compression: number;
  };
  iqrFences?: {
    yield?: { q1: number; q3: number; iqr: number };
    snr?: { q1: number; q3: number; iqr: number };
    leverage?: { q1: number; q3: number; iqr: number };
    velocity?: { q1: number; q3: number; iqr: number };
  };
  benfordResults?: {
    input_chi2: number;
    output_chi2: number;
    cache_read_chi2: number;
    cache_write_chi2: number;
    total_chi2: number;
  };
  humanCount: number;
}

function fmtNum(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export default function TwoLevelStats({
  medians,
  iqrFences,
  benfordResults,
  humanCount,
}: TwoLevelStatsProps) {
  const quickStats = [
    { label: "Yield (Y)", value: medians.yield.toFixed(2), color: "#d4af37" },
    { label: "SNR", value: `${(medians.snr * 100).toFixed(1)}%`, color: "#10b981" },
    { label: "Leverage", value: `${medians.leverage.toFixed(1)}x`, color: "#8b5cf6" },
    { label: "Velocity", value: `${medians.velocity.toFixed(2)}x`, color: "#3498db" },
    { label: "Total tokens", value: fmtNum(medians.total_tokens), color: "#e17055" },
    { label: "Tokens/day", value: fmtNum(medians.tokens_per_day), color: "#5b6472" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Quick View */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {quickStats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-bg-border bg-bg-surface p-3"
          >
            <div className="font-mono text-xs text-text-muted">{s.label}</div>
            <div
              className="mt-1 font-mono text-xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Human Center of Mass: {humanCount.toLocaleString()} operators. Median
        of ratios.
      </p>

      {/* Statistical Details (collapsible) */}
      <details className="group rounded-lg border border-bg-border bg-bg-surface">
        <summary className="cursor-pointer px-4 py-3 font-sans text-sm font-bold text-text-secondary transition-colors hover:text-text-primary">
          Statistical Details
          <span className="ml-2 text-text-muted group-open:rotate-180 inline-block transition-transform">
            ▾
          </span>
        </summary>
        <div className="border-t border-bg-border px-4 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* IQR table */}
            {iqrFences && (
              <div>
                <h4 className="mb-2 font-sans text-sm font-bold text-text-primary">
                  Interquartile Ranges
                </h4>
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-bg-border text-text-muted">
                      <th className="py-1 text-left">Metric</th>
                      <th className="py-1 text-right">Q1</th>
                      <th className="py-1 text-right">Q3</th>
                      <th className="py-1 text-right">IQR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iqrFences.yield && (
                      <tr className="border-b border-bg-border-subtle">
                        <td className="py-1 text-gold">Yield</td>
                        <td className="py-1 text-right">{iqrFences.yield.q1.toFixed(2)}</td>
                        <td className="py-1 text-right">{iqrFences.yield.q3.toFixed(2)}</td>
                        <td className="py-1 text-right">{iqrFences.yield.iqr.toFixed(2)}</td>
                      </tr>
                    )}
                    {iqrFences.leverage && (
                      <tr className="border-b border-bg-border-subtle">
                        <td className="py-1 text-purple-400">Leverage</td>
                        <td className="py-1 text-right">{iqrFences.leverage.q1.toFixed(1)}</td>
                        <td className="py-1 text-right">{iqrFences.leverage.q3.toFixed(1)}</td>
                        <td className="py-1 text-right">{iqrFences.leverage.iqr.toFixed(1)}</td>
                      </tr>
                    )}
                    {iqrFences.velocity && (
                      <tr className="border-b border-bg-border-subtle">
                        <td className="py-1 text-blue-400">Velocity</td>
                        <td className="py-1 text-right">{iqrFences.velocity.q1.toFixed(2)}</td>
                        <td className="py-1 text-right">{iqrFences.velocity.q3.toFixed(2)}</td>
                        <td className="py-1 text-right">{iqrFences.velocity.iqr.toFixed(2)}</td>
                      </tr>
                    )}
                    {iqrFences.snr && (
                      <tr>
                        <td className="py-1 text-green-400">SNR</td>
                        <td className="py-1 text-right">{(iqrFences.snr.q1 * 100).toFixed(2)}%</td>
                        <td className="py-1 text-right">{(iqrFences.snr.q3 * 100).toFixed(2)}%</td>
                        <td className="py-1 text-right">{(iqrFences.snr.iqr * 100).toFixed(2)}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Benford results */}
            {benfordResults && (
              <div>
                <h4 className="mb-2 font-sans text-sm font-bold text-text-primary">
                  Benford&apos;s Law chi-square
                </h4>
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-bg-border text-text-muted">
                      <th className="py-1 text-left">Pillar</th>
                      <th className="py-1 text-right">&chi;&sup2;</th>
                      <th className="py-1 text-right">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Input", chi2: benfordResults.input_chi2 },
                      { label: "Output", chi2: benfordResults.output_chi2 },
                      { label: "Cache Read", chi2: benfordResults.cache_read_chi2 },
                      { label: "Cache Write", chi2: benfordResults.cache_write_chi2 },
                      { label: "Total", chi2: benfordResults.total_chi2 },
                    ].map((r) => (
                      <tr key={r.label} className="border-b border-bg-border-subtle">
                        <td className="py-1 text-text-secondary">{r.label}</td>
                        <td className="py-1 text-right text-text-primary">{r.chi2.toFixed(2)}</td>
                        <td
                          className="py-1 text-right font-bold"
                          style={{ color: r.chi2 < 15.51 ? "#2ecc71" : "#e74c3c" }}
                        >
                          {r.chi2 < 15.51 ? "PASS" : "FAIL"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-text-muted">
                  Critical value: &chi;&sup2; &lt; 15.51 (df=8, p=0.05)
                </p>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
