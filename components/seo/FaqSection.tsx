/**
 * FaqSection — visible FAQ rendered from the same array passed to faqPage()
 * JSON-LD, so structured data always matches on-page content. Markup/classes
 * mirror the static blog posts' FAQ block (dl/dt/dd under an h2 "FAQ").
 */
export function FaqSection({
  faqs,
  id = "faq",
}: {
  faqs: readonly { question: string; answer: string }[];
  id?: string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 border-t border-bg-border-subtle pt-6 scroll-mt-20"
    >
      <h2 id={headingId} className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
        FAQ
      </h2>
      <dl className="flex flex-col gap-4">
        {faqs.map((f) => (
          <div key={f.question} className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">{f.question}</dt>
            <dd className="text-base text-text-secondary">{f.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
