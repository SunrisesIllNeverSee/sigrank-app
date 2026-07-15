/**
 * EightyPercentBand — shaded 10th-90th percentile band on yield histogram.
 *
 * Uses the pre-generated PNG (14-eighty-percent-band.png) which shows the
 * yield distribution histogram with the 80% band shaded gold and the median
 * marked. Pure static image, responsive.
 */

import Image from "next/image";

export interface EightyPercentBandProps {
  p10?: number;
  p90?: number;
  median?: number;
}

export default function EightyPercentBand({
  p10 = 0.04,
  p90 = 394,
  median = 1.69,
}: EightyPercentBandProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
        <Image
          src="/article-charts/14-eighty-percent-band.png"
          alt={`Yield distribution histogram with 80% band shaded (P10=${p10.toFixed(2)} to P90=${p90.toFixed(2)}), median ${median.toFixed(2)}`}
          width={1200}
          height={700}
          className="h-auto w-full"
        />
      </div>
      <p className="text-xs text-text-muted">
        80% of human operators have a yield between{" "}
        <span className="font-mono text-gold">{p10.toFixed(2)}</span> and{" "}
        <span className="font-mono text-gold">{p90.toFixed(2)}</span>. The
        median is <span className="font-mono text-gold">{median.toFixed(2)}</span>.
        The distribution is heavily right-skewed (power-law), which is why the
        median is used instead of the mean.
      </p>
    </div>
  );
}
