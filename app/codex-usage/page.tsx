/**
 * app/codex-usage/page.tsx: "Codex usage" guide (usage pages batch, Nov 2026).
 *
 * Targets codex usage / usage dashboard / usage limit / cost (DataForSEO, US).
 * Checked 2026-11-12 against OpenAI's Codex pricing page
 * (developers.openai.com/codex/pricing), the Codex CLI 0.167.1 binary
 * (/status exists; there is no /usage slash command) and the sigrank CLI
 * reference (Codex adapter: ~/.codex/sessions; cache write split from input).
 * Re-check on every edit and update CHECKED. OpenAI's message counts are
 * shown as OpenAI's own estimates, never as fixed limits.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { UsageGuide, type UsageFaq, type UsageSection } from "@/components/usage/UsageGuide";

const PATH = "/codex-usage";
const TITLE = "Codex usage: check it, know your limits, read the cost";
const DESCRIPTION =
  "How to check Codex usage with /status and the usage dashboard, how the 5-hour and weekly limits work on each plan, and what uses them up.";
const CHECKED = "Checked against OpenAI docs on November 12, 2026.";
const DASHBOARD = "https://chatgpt.com/codex/settings/usage";

export const metadata: Metadata = withOG({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-gold underline underline-offset-2" rel="noopener">
    {children}
  </a>
);

const th = "p-3 font-mono text-xs uppercase tracking-wide text-text-muted";
const td = "p-3 font-sans text-sm text-text-secondary";

const MESSAGES: [string, string][] = [
  ["GPT-6 Astra", "5 to 45"],
  ["GPT-6.1 Sol", "15 to 160"],
  ["GPT-6.1 Terra", "35 to 285"],
  ["GPT-6 Sol", "15 to 150"],
  ["GPT-6 Luna", "350 to 3,000"],
];

const CREDITS: [string, string, string, string][] = [
  ["GPT-6 Astra", "250", "25", "1,250"],
  ["GPT-6.1 Sol", "50", "2.5", "250"],
  ["GPT-6.1 Terra", "25", "1.25", "125"],
  ["GPT-6 Sol", "50", "5", "250"],
  ["GPT-6 Luna", "2.5", "0.25", "12.5"],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-bg-border">
            {head.map((h) => (
              <th key={h} className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-bg-border-subtle last:border-b-0">
              {r.map((c, i) => (
                <td key={i} className={i === 0 ? `${td} font-mono text-text-primary` : td}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SECTIONS: UsageSection[] = [
  {
    id: "check",
    heading: "Check your Codex usage",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-text-primary">
            <code>/status</code> in the Codex CLI:
          </strong>{" "}
          your remaining limits during an active session, with the session&rsquo;s configuration and
          token usage.
        </li>
        <li>
          <strong className="text-text-primary">Usage dashboard</strong> (
          <A href={DASHBOARD}>chatgpt.com/codex/settings/usage</A>): your current limits and reset
          times.
        </li>
        <li>
          <strong className="text-text-primary">API key users:</strong> the OpenAI Platform usage page
          shows API spend. It doesn&rsquo;t show ChatGPT plan limits.
        </li>
      </ul>
    ),
  },
  {
    id: "limits",
    heading: "Codex limits by plan",
    body: (
      <>
        <p>
          Codex is included in ChatGPT plans. Local messages and cloud chats share your plan&rsquo;s
          usage allowance, and cloud tasks may use more of it than local messages.
        </p>
        <p>
          <strong className="text-text-primary">Plus and Standard Business</strong> have a five-hour
          window. OpenAI&rsquo;s estimates of local messages per five hours:
        </p>
        <Table head={["Model", "Local messages per 5 hours (estimate)"]} rows={MESSAGES} />
        <p>
          OpenAI says these &ldquo;are not fixed message limits&rdquo; and that weekly limits may also
          apply.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Pro:</strong> currently no five-hour limit. Weekly
            limits may apply.
          </li>
          <li>
            <strong className="text-text-primary">Enterprise and Edu with flexible pricing:</strong> no
            fixed rate limits; usage scales with credits. Without flexible pricing, they have the same
            per-seat limits as Plus for most features.
          </li>
          <li>
            <strong className="text-text-primary">Speed modes use more:</strong> Fast uses included
            usage 2.5x as fast. Ultrafast, on GPT-6 Astra and GPT-6.1 Sol, uses it 8x as fast.
          </li>
          <li>
            <strong className="text-text-primary">When you hit the limit:</strong> Codex can finish the
            turn it&rsquo;s on. Plus and Pro users can buy credits, and anyone can run extra local chats
            with an API key at standard API rates.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cost",
    heading: "What Codex usage costs",
    body: (
      <>
        <p>
          On a plan, usage is included. Past that, credits pay for it at these rates per million tokens
          (Standard speed):
        </p>
        <Table head={["Model", "Input", "Cached input", "Output"]} rows={CREDITS.map((r) => [r[0], `${r[1]} credits`, `${r[2]} credits`, `${r[3]} credits`])} />
        <p>
          With an API key, standard{" "}
          <A href="https://platform.openai.com/docs/pricing">OpenAI API prices</A> apply instead.
        </p>
      </>
    ),
  },
  {
    id: "why",
    heading: "Why your Codex usage runs out faster than expected",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-text-primary">Model and speed.</strong> Bigger models use more of the
          allowance per message, and Fast and Ultrafast multiply it.
        </li>
        <li>
          <strong className="text-text-primary">Fresh input is the expensive part.</strong> In
          OpenAI&rsquo;s credit rates, cached input costs a tenth of fresh input on most Codex models
          and a twentieth on GPT-6.1 Sol and GPT-6.1 Terra.
        </li>
        <li>
          <strong className="text-text-primary">Context on every message.</strong> A long AGENTS.md,
          extra files in context and MCP servers you aren&rsquo;t using all add tokens to each request.
        </li>
      </ul>
    ),
  },
  {
    id: "track",
    heading: "Track Codex usage across sessions",
    body: (
      <p>
        Codex keeps session logs in <code>~/.codex/sessions</code> (and{" "}
        <code>~/.codex/archived_sessions</code>). <code>npx sigrank</code> reads them and shows input,
        output and cache counts across the available time windows, and{" "}
        <code>sigrank compare --platform codex</code> checks those counts across your local sources.
        Codex logs count cache writes inside input, so SigRank estimates the split for Codex; the CLI
        reference documents how.
      </p>
    ),
  },
  {
    id: "yield",
    heading: "Usage tells you how much. Yield tells you how well.",
    body: (
      <>
        <p>
          Same limit, very different output. SigRank scores it with Yield: cache read × output ÷
          input². On GPT-6.1 Sol a cached token costs a twentieth of a fresh one, so reusing context is
          where the score comes from.{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            How Yield works
          </Link>
        </p>
        <p>
          Run <code>npx sigrank</code> to see yours. Nothing is published until you run{" "}
          <code>sigrank submit</code>, and <code>sigrank submit --dry-run</code> shows the exact payload
          first. Prompts, responses, file paths and repo or project names are never sent.
        </p>
      </>
    ),
  },
];

const FAQS: UsageFaq[] = [
  {
    question: "How do I check my Codex usage?",
    answer:
      "Type /status in the Codex CLI during a session, or open the Codex usage dashboard at chatgpt.com/codex/settings/usage for limits and reset times.",
  },
  {
    question: "When does Codex usage reset?",
    answer:
      "On Plus and Standard Business, the five-hour window resets five hours after it starts. Weekly limits, where they apply, reset on their own schedule. The usage dashboard shows the reset times.",
  },
  {
    question: "Is Codex usage separate from ChatGPT?",
    answer:
      "No. Codex is included in your ChatGPT plan, and local messages and cloud chats share the plan's usage allowance.",
  },
  {
    question: "How much Codex usage comes with ChatGPT Plus?",
    answer:
      "OpenAI estimates 15 to 160 local messages per five hours on GPT-6.1 Sol, depending on the task. It is not a fixed number.",
  },
  {
    question: "Does Codex Pro have a 5-hour limit?",
    answer: "Not currently. Weekly limits may apply.",
  },
  {
    question: "What happens when I hit the Codex limit?",
    answer:
      "Codex can finish the turn it is on. Then you can wait for the reset, buy credits on Plus or Pro, or run local chats with an API key at standard API rates.",
  },
  {
    question: "Does SigRank read my code?",
    answer:
      "No. Prompts, responses, file paths and repo or project names are never sent, and nothing is sent until you run sigrank submit.",
  },
];

export default function CodexUsagePage() {
  return (
    <UsageGuide
      tool="codex"
      path={PATH}
      crumb="Codex usage"
      title={TITLE}
      description={DESCRIPTION}
      h1={TITLE}
      lead={
        <p>
          In the Codex CLI, type <code>/status</code> to see your remaining limits during a session.
          Outside a session, open the <A href={DASHBOARD}>Codex usage dashboard</A> for your limits and
          reset times.
        </p>
      }
      checked={CHECKED}
      datePublished="2026-11-12"
      dateModified="2026-11-12"
      sections={SECTIONS}
      faqs={FAQS}
      sources={
        <>
          Sources: <A href="https://developers.openai.com/codex/pricing">OpenAI Codex pricing</A>,{" "}
          <A href="https://platform.openai.com/docs/pricing">OpenAI API pricing</A>, and the Codex CLI
          (v0.167.1).
        </>
      }
    />
  );
}
