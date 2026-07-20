/**
 * WhyItMatters — the "volume isn't yield" hook.
 *
 * Two side-by-side cards showing the counterintuitive truth with real data:
 *   - 487B tokens, 33.7% input → yield 0.02
 *   - 253M tokens, 0.01% input → yield 1,825
 *
 * No name-calling. The data speaks for itself: 1,900× less volume,
 * 91,000× more yield.
 *
 * Pure server component. No client JS.
 */

export default function WhyItMatters() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        Why it matters
      </div>
      <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
        More tokens doesn&apos;t mean better. The operators with the highest
        yield use{" "}
        <span className="font-bold text-text-primary">almost no fresh input</span>{" "}
        — they compound cached context instead. Volume-based leaderboards
        reward the wrong thing. SigRank surfaces the operators who actually
        compound.
      </p>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {/* High volume, low yield */}
        <div className="flex flex-col gap-2 rounded-xl border border-bg-border bg-bg-surface p-5 text-left">
          <h4 className="font-mono text-sm font-bold text-text-secondary">
            487B tokens
          </h4>
          <p className="font-sans text-xs text-text-muted">
            ranked #1 by volume
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Input</span>
            <span className="font-mono text-sm font-bold text-text-muted">33.7%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Cache Read</span>
            <span className="font-mono text-sm font-bold text-text-muted">60.9%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Output</span>
            <span className="font-mono text-sm font-bold text-text-muted">5.3%</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bg-border-subtle pt-3">
            <span className="font-sans text-sm text-text-secondary">Yield</span>
            <span className="font-mono text-lg font-bold text-text-muted">0.02</span>
          </div>
        </div>

        {/* Low volume, high yield */}
        <div className="flex flex-col gap-2 rounded-xl border border-gold/25 bg-gold/5 p-5 text-left">
          <h4 className="font-mono text-sm font-bold text-gold">
            253M tokens ★
          </h4>
          <p className="font-sans text-xs text-text-muted">
            ranked #1,142 by volume
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Input</span>
            <span className="font-mono text-sm font-bold text-[#2ec4a0]">0.01%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Cache Read</span>
            <span className="font-mono text-sm font-bold text-[#2ec4a0]">94.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Cache Write</span>
            <span className="font-mono text-sm font-bold text-[#2ec4a0]">5.2%</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-bg-border-subtle pt-3">
            <span className="font-sans text-sm text-text-secondary">Yield</span>
            <span className="font-mono text-lg font-bold text-gold">1,825</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-center">
        <p className="font-sans text-sm leading-relaxed text-text-primary">
          1,900× less volume.{" "}
          <span className="font-bold text-gold">91,000× more yield.</span>
          {" "}Composition is the only variable that matters.
        </p>
      </div>
    </div>
  );
}
