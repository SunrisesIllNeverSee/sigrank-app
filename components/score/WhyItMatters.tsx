/**
 * WhyItMatters — the "volume isn't yield" hook.
 *
 * Two side-by-side cards showing the counterintuitive truth:
 *   - The dumper: 487B tokens, 33.7% input, yield 0.02 (ranked #1 by volume)
 *   - The compounder: 253M tokens, 0.01% input, yield 1,825 (ranked #1,142 by volume)
 *
 * Real data from the blog post (volume-isnt-yield.md). The contrast
 * is the hook: 1,900× less volume, 91,000× more yield.
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
        More tokens doesn&apos;t mean better. The best operators use{" "}
        <span className="font-bold text-text-primary">almost no fresh input</span>{" "}
        — they compound cached context instead. The worst operators dump the
        most tokens. Volume-based leaderboards rank the dumpers. SigRank ranks
        the compounders.
      </p>

      <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {/* The dumper */}
        <div className="flex flex-col gap-2 rounded-xl border border-e74c3c/25 bg-bg-surface p-5 text-left">
          <h4 className="font-mono text-sm font-bold text-[#e74c3c]">
            The dumper
          </h4>
          <p className="font-sans text-xs text-text-muted">
            487B total tokens · ranked #1 by volume
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-sans text-xs text-text-muted">Input</span>
            <span className="font-mono text-sm font-bold text-[#e74c3c]">33.7%</span>
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
            <span className="font-mono text-lg font-bold text-[#e74c3c]">0.02</span>
          </div>
          <p className="mt-2 font-sans text-xs leading-relaxed text-text-muted">
            Re-explains everything from scratch every turn. 487 billion
            tokens, almost nothing to show for it.
          </p>
        </div>

        {/* The compounder */}
        <div className="flex flex-col gap-2 rounded-xl border border-e17055/25 bg-bg-surface p-5 text-left">
          <h4 className="font-mono text-sm font-bold text-[#e17055]">
            The compounder ★
          </h4>
          <p className="font-sans text-xs text-text-muted">
            253M total tokens · ranked #1,142 by volume
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
            <span className="font-mono text-lg font-bold text-[#e17055]">1,825</span>
          </div>
          <p className="mt-2 font-sans text-xs leading-relaxed text-text-muted">
            Every word becomes 900 words of cached context. 253M tokens —
            1,900× less volume, 91,000× more yield.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-center">
        <p className="font-sans text-sm leading-relaxed text-text-primary">
          Volume says{" "}
          <span className="font-bold text-[#e74c3c]">&ldquo;irrelevant&rdquo;</span>.
          {" "}Yield says{" "}
          <span className="font-bold text-[#e17055]">&ldquo;elite&rdquo;</span>.
          {" "}SigRank is the only place that surfaces the compounders.
        </p>
      </div>
    </div>
  );
}
