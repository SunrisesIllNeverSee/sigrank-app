/**
 * app/claude-code-usage/page.tsx: "Claude Code usage" guide (usage pages batch, Nov 2026).
 *
 * Targets claude code usage / cost / limits / token usage (DataForSEO, US).
 * Every factual line was checked on 2026-11-12 against code.claude.com/docs
 * (costs, commands, prompt-caching, vs-code, analytics, claude-directory,
 * settings-reference), the Claude Help Center (11647753, 17007452) and the
 * Anthropic pricing page. Re-check on every edit and update CHECKED.
 * No fixed limit numbers: Anthropic does not publish them.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { UsageGuide, type UsageFaq, type UsageSection } from "@/components/usage/UsageGuide";

const PATH = "/claude-code-usage";
const TITLE = "Claude Code usage: check it, know your limits, read the cost";
const DESCRIPTION =
  "How to check Claude Code usage with /usage, how the 5-hour and weekly limits work, and what the cost figure means. Checked against Anthropic docs.";
const CHECKED = "Checked against Anthropic docs on November 12, 2026.";

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

const SECTIONS: UsageSection[] = [
  {
    id: "check",
    heading: "Check your usage in Claude Code",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-text-primary">Session block.</strong> Input, output, cache-read and
          cache-write tokens by model, with a dollar total for the session. It is meant for API users,
          and it resets when <code>/clear</code> starts a new session.
        </li>
        <li>
          <strong className="text-text-primary">Prompt cache line</strong> (Claude Code v2.1.251 or
          later). The share of input served from cache, the number of misses, and whether the cache is
          warm. From v2.1.260 it can also name the likely cause of the last miss.
        </li>
        <li>
          <strong className="text-text-primary">Plan usage breakdown</strong> (Pro, Max, Ultra, Team,
          Enterprise). What counts against your plan, split by skills, subagents, plugins and MCP
          servers, with recommendations. Press <code>d</code> or <code>w</code> to switch between the
          last 24 hours and the last 7 days. From v2.1.305, press <code>f</code> to act on the
          recommendations: Claude Code shows you each change before making it.
        </li>
        <li>
          These figures come from session history on this machine. Usage on other devices or on
          claude.ai is not included.
        </li>
        <li>
          In VS Code, <code>/usage</code> opens the Account &amp; usage dialog, with the
          recommendations and a Day/Week toggle.
        </li>
      </ul>
    ),
  },
  {
    id: "outside",
    heading: "Check usage outside the terminal",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-text-primary">claude.ai, Settings &gt; Usage:</strong> how much of
          the current session you have used, the time remaining, and your next reset time.
        </li>
        <li>
          <strong className="text-text-primary">Claude Console:</strong> usage and spend for API keys.
        </li>
        <li>
          <strong className="text-text-primary">Analytics dashboards:</strong> for Team and Enterprise
          admins and owners, and for Console users with usage access.
        </li>
      </ul>
    ),
  },
  {
    id: "limits",
    heading: "Plan limits: the 5-hour session and the weekly limit",
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">Pro and Max:</strong> a session limit that starts
            with your first message and resets in full five hours later, plus weekly limits across all
            models.
          </li>
          <li>
            <strong className="text-text-primary">Ultra:</strong> verified Ultra accounts have no
            5-hour session limit.
          </li>
          <li>Some plans also have a separate weekly limit for Fable.</li>
          <li>
            Limits are shared across claude.ai, Claude Code and Claude Desktop: all of them count
            toward the same limit.
          </li>
        </ul>
        <p>
          Anthropic does not list token amounts for these limits and says it may adjust them, so this
          page doesn&rsquo;t give any. Settings &gt; Usage shows yours and when it resets.
        </p>
      </>
    ),
  },
  {
    id: "cost",
    heading: "What the cost figure means",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          On Pro, Max and Ultra, Anthropic says the session cost figure &ldquo;isn&rsquo;t relevant
          for billing purposes.&rdquo; Your plan covers the usage.
        </li>
        <li>
          Claude Code works out the figure on your machine from token counts at list price. If your
          organization&rsquo;s admin sets a <code>modelPricing</code> table in managed settings, it
          uses those rates instead.
        </li>
        <li>
          For scale, Anthropic reports that across enterprise deployments the average is about $13 per
          developer per active day and $150 to $250 per developer per month, with costs below $30 per
          active day for 90% of users.
        </li>
        <li>
          With usage credits on, <code>/usage</code> shows your spend for the month against any monthly
          limit you set. <code>/usage-credits</code> manages them.
        </li>
      </ul>
    ),
  },
  {
    id: "why",
    heading: "Why your usage runs out faster than expected",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-text-primary">Cache misses.</strong> Changing the system prompt or
          the tool set, or switching models, forces the cached context to be rebuilt. On older models,
          changing effort does too. The prompt cache line shows how often it happens. Editing
          CLAUDE.md mid-session does not break the cache, but the edit only applies from the next
          session.
        </li>
        <li>
          <strong className="text-text-primary">Fresh input is the expensive part.</strong> A cache
          read costs a tenth of fresh input on most Claude models, a twentieth on Opus 5.5 and Sonnet
          5.5, and a fortieth on Fable 5.1 and 5.2 (Anthropic list prices, November 12, 2026).
        </li>
        <li>
          <strong className="text-text-primary">Context you carry every turn.</strong> A large
          CLAUDE.md, many MCP servers and long-running loops add tokens to every request. The plan
          usage breakdown names the biggest ones.
        </li>
        <li>
          <strong className="text-text-primary">What helps:</strong> pick the model at the start of a
          session, <code>/clear</code> between unrelated tasks, <code>/compact</code> when a session
          gets long, and keep CLAUDE.md short.
        </li>
      </ul>
    ),
  },
  {
    id: "track",
    heading: "Track usage across sessions",
    body: (
      <>
        <p>
          Claude Code keeps session transcripts in <code>~/.claude/projects/</code> for 30 days by
          default; the <code>cleanupPeriodDays</code> setting changes that. Tools that read them:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-text-primary">ccusage:</strong> a daily and monthly dollar ledger.
          </li>
          <li>
            <strong className="text-text-primary">
              <code>npx sigrank</code>:
            </strong>{" "}
            input, output, cache-write and cache-read counts across the available time windows, with
            your Yield worked out on your machine.
          </li>
        </ul>
        <p>
          <Link href="/alternatives/ccusage-alternatives" className="text-gold underline underline-offset-2">
            More ccusage alternatives
          </Link>
        </p>
      </>
    ),
  },
  {
    id: "yield",
    heading: "Usage tells you how much. Yield tells you how well.",
    body: (
      <>
        <p>
          Two people can hit the same limit and get very different amounts of work out of it. SigRank
          scores that with Yield: cache read × output ÷ input². Fresh input is squared, so re-sending
          context drags the score down fast and reusing it pushes the score up.{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            How Yield works
          </Link>
          {" · "}
          <Link href="/guides/how-to-improve-your-yield" className="text-gold underline underline-offset-2">
            How to improve your Yield
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
    question: "How do I check my Claude Code usage?",
    answer:
      "Type /usage in a Claude Code session. For your session usage and reset time, open Settings > Usage on claude.ai.",
  },
  {
    question: "Is /cost the same as /usage?",
    answer: "Yes. /cost opens the same screen, and /stats opens it on the Stats tab.",
  },
  {
    question: "Is the /usage dollar amount my bill?",
    answer:
      "Not on a subscription. Anthropic says the figure isn't relevant for billing on Pro, Max and Ultra. On the API it is an estimate at list price.",
  },
  {
    question: "What are the Claude Code limits on Pro and Max?",
    answer:
      "A session limit that resets in full five hours after your first message, plus weekly limits. Anthropic doesn't list token amounts and may adjust them. Settings > Usage shows yours.",
  },
  {
    question: "When does my Claude Code limit reset?",
    answer:
      "The session limit resets five hours after the first message of the session. Settings > Usage on claude.ai shows your next reset time.",
  },
  {
    question: "Why does Claude Code use so many tokens?",
    answer:
      "Usually cache misses and context carried on every turn: a large CLAUDE.md, many MCP servers or long loops. The plan usage breakdown in /usage shows which.",
  },
  {
    question: "Does SigRank read my prompts?",
    answer:
      "No. Prompts, responses, file paths and repo or project names are never sent, and nothing is sent until you run sigrank submit.",
  },
];

export default function ClaudeCodeUsagePage() {
  return (
    <UsageGuide
      tool="claude-code"
      path={PATH}
      crumb="Claude Code usage"
      title={TITLE}
      description={DESCRIPTION}
      h1={TITLE}
      lead={
        <p>
          Type <code>/usage</code> in a Claude Code session; <code>/cost</code> and <code>/stats</code>{" "}
          open the same screen. On a Pro, Max or Ultra plan you see plan usage bars. On the API you see
          a dollar estimate.
        </p>
      }
      checked={CHECKED}
      datePublished="2026-11-12"
      dateModified="2026-11-12"
      sections={SECTIONS}
      faqs={FAQS}
      sources={
        <>
          Sources: <A href="https://code.claude.com/docs/en/costs">Claude Code: manage costs</A>,{" "}
          <A href="https://code.claude.com/docs/en/prompt-caching">prompt caching</A>,{" "}
          <A href="https://support.claude.com/en/articles/11647753-usage-and-length-limits">
            Claude Help Center: usage and length limits
          </A>
          , <A href="https://platform.claude.com/docs/en/about-claude/pricing">Anthropic pricing</A>.
        </>
      }
    />
  );
}
