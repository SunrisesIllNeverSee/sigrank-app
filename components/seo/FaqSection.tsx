/**
 * FaqSection — visible FAQ rendered from the same array passed to faqPage()
 * JSON-LD, so structured data always matches on-page content.
 *
 * Each question is a native <details>/<summary> disclosure, closed by default.
 * Answers stay in the DOM (crawlable, find-in-page works) and the summary is
 * keyboard-focusable with a visible focus ring. Server component — no JS.
 *
 * Variants:
 *   - "editorial" (default): text pages (site Tailwind tokens; matches the
 *     /about FAQ cards).
 *   - "workspace": app surfaces inside .lbw-root (board / compare) — styled by
 *     .ws-faq in components/live/proto-scoped.css with workspace tokens.
 *
 * `collapsed` wraps the whole list in one outer disclosure whose summary is
 * the heading, so the section costs a single line until opened (used at the
 * foot of the 100vh board stage).
 */
import type { ReactNode } from "react";

type Faq = { question: string; answer: string };

/** Render `inline code` spans (authored with backticks) as <code>. */
function renderAnswer(text: string, codeClass: string): ReactNode {
  if (!text.includes("`")) return text;
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
      <code key={i} className={codeClass}>
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function FaqSection({
  faqs,
  id = "faq",
  heading = "FAQ",
  variant = "editorial",
  collapsed = false,
}: {
  faqs: readonly Faq[];
  id?: string;
  heading?: string;
  variant?: "editorial" | "workspace";
  collapsed?: boolean;
}) {
  const headingId = `${id}-heading`;

  if (variant === "workspace") {
    const title = (
      <h2 id={headingId} className="ws-faq-h">
        {heading}
        {collapsed && <span className="ws-faq-n"> · {faqs.length} questions</span>}
      </h2>
    );
    const list = (
      <div className="ws-faq-list">
        {faqs.map((f) => (
          <details key={f.question} className="ws-faq-item">
            <summary>{f.question}</summary>
            <p>{renderAnswer(f.answer, "ws-faq-code")}</p>
          </details>
        ))}
      </div>
    );
    return (
      <section id={id} aria-labelledby={headingId} className="ws-faq">
        {collapsed ? (
          <details className="ws-faq-outer">
            <summary>{title}</summary>
            {list}
          </details>
        ) : (
          <>
            {title}
            {list}
          </>
        )}
      </section>
    );
  }

  const summaryFocus =
    "rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 border-t border-bg-border-subtle pt-6 scroll-mt-20"
    >
      <h2 id={headingId} className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
        {heading}
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((f) => (
          <details
            key={f.question}
            className="group rounded-lg border border-bg-border bg-bg-surface p-4"
          >
            <summary
              className={`cursor-pointer font-sans text-base font-semibold text-text-primary ${summaryFocus}`}
            >
              {f.question}
            </summary>
            <p className="mt-2 font-sans text-base leading-relaxed text-text-secondary">
              {renderAnswer(
                f.answer,
                "rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold",
              )}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
