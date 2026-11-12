/**
 * UsageGuide: shared server-rendered layout for the tool usage pages
 * (/claude-code-usage, /codex-usage). The whole body is in the server HTML.
 * JSON-LD: TechArticle + BreadcrumbList. FAQPage schema is /faq-only site-wide
 * (components/seo/JsonLd.tsx, 2026-11 spam-update cleanup); the FAQ stays as text.
 * No HowTo, Product or Offer markup on prices or limits.
 */
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumb } from "@/lib/jsonld";
import { UsageCta } from "./UsageCta";

export type UsageSection = { id: string; heading: string; body: ReactNode };
export type UsageFaq = { question: string; answer: string };

export function UsageGuide(props: {
  tool: "claude-code" | "codex";
  path: string;
  crumb: string;
  title: string;
  description: string;
  h1: string;
  lead: ReactNode;
  checked: string; // e.g. "Checked against Anthropic docs on November 12, 2026."
  datePublished: string;
  dateModified: string;
  sections: UsageSection[];
  faqs: UsageFaq[];
  sources: ReactNode;
}) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd({
            path: props.path,
            title: props.title,
            description: props.description,
            datePublished: props.datePublished,
            dateModified: props.dateModified,
            type: "TechArticle",
            section: "Guides",
          }),
          breadcrumb([{ name: props.crumb, path: props.path }]),
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold leading-tight text-text-primary">{props.h1}</h1>
        <div className="font-sans text-base leading-relaxed text-text-secondary">{props.lead}</div>
        <p className="font-mono text-xs text-text-muted">{props.checked}</p>
      </header>

      {props.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex flex-col gap-3">
          <h2 className="font-mono text-base font-bold text-text-primary">{s.heading}</h2>
          <div className="usage-body flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
            {s.body}
          </div>
        </section>
      ))}

      <UsageCta tool={props.tool} />

      <section className="flex flex-col gap-4" id="faq">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {props.faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-sans text-sm font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex flex-col gap-1 border-t border-bg-border pt-4 font-sans text-xs text-text-muted">
        <div>{props.sources}</div>
        <div>{props.checked}</div>
      </footer>
    </article>
  );
}
