/**
 * FieldEvidence: a short in-body section on the real-competitor /vs pages
 * (owner 2026-11-12, Ploy crawl finding). It links the three data posts from
 * the page body, so crawlers that read /vs pages reach them, and on tools
 * people already run it adds the counter-position line ("Already using X?").
 * Every number here is published on /field and /blog/volume-isnt-yield.
 */
import Link from "next/link";

const linkCls = "text-gold underline underline-offset-2";

export function FieldEvidence({ tool, alreadyUsing = false }: { tool: string; alreadyUsing?: boolean }) {
  return (
    <section className="flex flex-col gap-3" id="field-evidence">
      <h2 className="font-mono text-base font-bold text-text-primary">What the July 2026 field showed</h2>
      <p className="font-sans text-sm leading-relaxed text-text-secondary">
        In a frozen field of 1,642 operators, the highest-Yield operator ranked #697 by volume, and
        92.4% of the median operator&rsquo;s tokens were cache reads. Volume and efficiency are
        different questions. The findings:{" "}
        <Link href="/blog/volume-isnt-yield" className={linkCls}>
          Volume Isn&rsquo;t Yield
        </Link>
        {" · "}
        <Link href="/blog/the-operator-explains-95-percent-of-the-difference" className={linkCls}>
          The Operator Explains 95% of the Difference
        </Link>
        {" · "}
        <Link href="/blog/the-three-modes-behind-the-ai-operator-board" className={linkCls}>
          The Three Modes Behind the Board
        </Link>
        .
      </p>
      {alreadyUsing && (
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Already using {tool}?</strong> Keep it. Run{" "}
          <code className="font-mono text-gold">npx sigrank</code> on the same local logs to see your
          Yield next to the field. Token counts only, never prompts.
        </p>
      )}
    </section>
  );
}
