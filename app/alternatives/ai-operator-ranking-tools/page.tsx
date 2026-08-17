/**
 * app/alternatives/ai-operator-ranking-tools/page.tsx —
 * "Best AI Operator Ranking Tools (2026)"
 *
 * SEO listicle targeting "ai operator ranking tools", "ai operator
 * leaderboard", "ai user ranking". Distinct from metrics or efficiency
 * listicles: this page focuses on tools that *rank* or *leaderboard* AI
 * operators (humans driving AI), not just measure them. Most surfaces rank
 * models; only SigRank and its satellite SigArena rank operators.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage +
 * ItemList), WaveHero, and Tailwind theme tokens matching the repo convention.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, alternativesItemList } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Best AI Operator Ranking Tools (2026)",
  description:
    "The 6 best AI operator ranking tools in 2026. SigRank, LMSYS Chatbot Arena, BigCode Models Leaderboard, Hugging Face Open LLM Leaderboard, Chatbot Arena Leaderboard, and SigArena — which actually ranks operators, not just models.",
  path: "/alternatives/ai-operator-ranking-tools",
});

type Tool = {
  name: string;
  measures: string;
  pros: string[];
  cons: string[];
  pricing: string;
  bestFor: string;
  featured?: boolean;
};

const TOOLS: Tool[] = [
  {
    name: "SigRank",
    measures:
      "Operator-level token-cascade efficiency — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. The only tool that ranks the human driving the AI, not the model itself.",
    pros: [
      "Ranks operators (humans), not models — the only leaderboard measuring the person driving the AI",
      "Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions",
      "Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison",
      "Class tiers from IGNITER to ARCH+ — you see exactly where you stand among operators",
    ],
    cons: [
      "Newer ecosystem — leaderboard sample still growing",
      "Requires a CLI install and enrollment to submit",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Operators who want to be ranked on a live, cross-platform leaderboard",
    featured: true,
  },
  {
    name: "LMSYS Chatbot Arena",
    measures:
      "Crowd-sourced model ranking via pairwise human preference votes. Ranks which LLM humans prefer in blind side-by-side chats, not how efficiently any operator uses one.",
    pros: [
      "Large, active voting community — the de facto model preference leaderboard",
      "Blind pairwise comparison reduces brand bias",
      "Elo-style ranking is well-understood and frequently updated",
    ],
    cons: [
      "Ranks models, not operators — tells you which LLM is popular, not who uses AI well",
      "Preference votes, not efficiency metrics — no yield, leverage, or cascade scoring",
      "No operator identity, no per-user telemetry, no coding-specific ranking",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Choosing which model to use, not ranking who uses models best",
  },
  {
    name: "BigCode Models Leaderboard",
    measures:
      "Code-generation model benchmark leaderboard — ranks LLMs on coding tasks (HumanEval-style and BigCode's own evals). Measures model code quality, not operator skill.",
    pros: [
      "Focused on code generation — directly relevant to AI coding workflows",
      "Transparent benchmark methodology with reproducible eval sets",
      "Ranks open and closed models side-by-side on coding tasks",
    ],
    cons: [
      "Ranks models, not operators — blind to the human driving the AI",
      "Benchmark tasks are synthetic — not real-world coding sessions",
      "No token-cascade metrics, no operator identity, no live leaderboard of people",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Comparing which code-generation model scores best on benchmarks",
  },
  {
    name: "Hugging Face Open LLM Leaderboard",
    measures:
      "General-purpose open-LLM ranking across a battery of standard benchmarks (MMLU, GSM8K, ARC, etc.). Ranks models on broad capability, not operator efficiency.",
    pros: [
      "Comprehensive coverage of open-source models",
      "Standardized benchmark suite — easy to compare across model families",
      "Frequently updated as new models are released",
    ],
    cons: [
      "Ranks models, not operators — no human in the loop",
      "General benchmarks, not coding-specific — weak signal for AI coding skill",
      "No token-cascade metrics, no operator identity, no real-session data",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Tracking which open-source LLM performs best on general benchmarks",
  },
  {
    name: "Chatbot Arena Leaderboard",
    measures:
      "LMSYS's aggregated leaderboard view — model Elo ratings derived from Chatbot Arena votes. A consolidated ranking surface for model preference, not operator performance.",
    pros: [
      "Single consolidated view of model Elo ratings across categories",
      "Category breakdowns (coding, hard prompts, vision) add granularity",
      "Updated continuously as new votes come in",
    ],
    cons: [
      "Still ranks models, not operators — the unit of measurement is the LLM",
      "Preference-based, not efficiency-based — no cascade or yield metrics",
      "No operator identity, no per-user scoring, no real-session telemetry",
    ],
    pricing: "Free (open leaderboard)",
    bestFor: "Browsing consolidated model Elo ratings across categories",
  },
  {
    name: "SigArena",
    measures:
      "Satellite operator-ranking leaderboard from sigeconomy.com — mirrors SigRank's operator-ranking methodology in a competitive arena format. The only other surface that ranks operators, not models.",
    pros: [
      "Ranks operators (humans), not models — same unit of measurement as SigRank",
      "Competitive arena format adds gamification and head-to-head operator matches",
      "Shares SigRank's cascade-efficiency methodology and scoring",
    ],
    cons: [
      "SigRank satellite — not an independent ranking methodology",
      "Smaller sample than the main SigRank leaderboard",
      "Requires the same CLI enrollment as SigRank to participate",
    ],
    pricing: "Free (open-source, same stack as SigRank)",
    bestFor: "Operators who want arena-style head-to-head ranking alongside SigRank",
  },
];

const FAQS = [
  {
    question: "What are AI operator ranking tools?",
    answer:
      "AI operator ranking tools rank or leaderboard the humans who drive AI — not the AI models themselves. Most AI leaderboards (LMSYS, BigCode, Hugging Face) rank models by benchmark scores or human preference votes. Operator ranking is different: it measures how efficiently a person uses AI across real coding sessions and ranks them against other operators. SigRank is the primary operator-ranking leaderboard; SigArena is its satellite arena surface.",
  },
  {
    question: "How is operator ranking different from model ranking?",
    answer:
      "Model ranking asks 'which LLM is best?' — it compares GPT-4, Claude, Gemini, and open models on benchmarks or preference votes. Operator ranking asks 'who uses AI best?' — it compares the humans driving those models on real-session efficiency. A great operator with a mid-tier model can outperform a poor operator with the best model. SigRank's Υ Yield (cache_read × output / input²) scores the operator's cascade architecture, not the model's raw capability.",
  },
  {
    question: "Which tool is best for ranking AI operators?",
    answer:
      "SigRank is the only independent leaderboard that ranks AI operators on token-cascade efficiency. LMSYS, BigCode, and Hugging Face rank models, not operators. SigArena is SigRank's satellite — it uses the same methodology in an arena format but is not a separate ranking system. If you want to see where you stand among operators, SigRank is the canonical leaderboard.",
  },
  {
    question: "Can I rank myself as an AI operator?",
    answer:
      "Yes. Install the SigRank CLI (npm install -g sigrank), enroll, and submit a verified snapshot of your token telemetry. Your cascade-efficiency score (Υ Yield, compression ratio, leverage, velocity) is computed on-device and submitted with an ed25519 signature. You appear on the live leaderboard with 7d/30d/90d/all-time windows and a class tier from IGNITER to ARCH+.",
  },
  {
    question: "Are AI operator ranking tools free?",
    answer:
      "Yes. SigRank and SigArena are free and open-source (MIT-licensed CLI, CC-BY-4.0 data). LMSYS Chatbot Arena, BigCode Models Leaderboard, Hugging Face Open LLM Leaderboard, and Chatbot Arena Leaderboard are all free to browse. The difference is that only SigRank and SigArena rank operators — the rest rank models and cost nothing to view but cannot rank you as a person.",
  },
];

export default function AIOperatorRankingToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "AI Operator Ranking Tools",
              path: "/alternatives/ai-operator-ranking-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/ai-operator-ranking-tools",
            "Best AI Operator Ranking Tools (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Operator Ranking Tools (2026)"
        subtitle={
          <>
            Six ranking surfaces. Five rank{" "}
            <span className="text-gold">models</span>. Only one ranks the{" "}
            <span className="text-gold">operator</span>.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most "AI ranking" tools rank <em>models</em>. LMSYS Chatbot Arena
          ranks which LLM humans prefer. BigCode ranks which model generates
          better code. Hugging Face ranks which open model scores best on
          benchmarks. None of these rank <strong className="text-text-primary">operators</strong> —
          the humans who actually drive the AI in real coding sessions.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the only independent leaderboard that ranks operators on
          token-cascade efficiency with the Υ Yield metric (
          <span className="font-mono text-gold">cache_read × output / input²</span>).
          SigArena is its satellite — same methodology, arena format. The four
          model-ranking leaderboards below are excellent at what they do, but
          they answer a different question: "which model is best?" not "who
          uses AI best?"
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Tool
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  What it ranks
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Ranks operators?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Pricing
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr
                  key={t.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${t.featured ? "bg-gold/5" : ""}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {t.featured ? (
                      <span className="text-gold">{t.name}</span>
                    ) : (
                      t.name
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {t.measures.split("—")[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? (
                      <span className="text-gold">Yes — the only one</span>
                    ) : t.name === "SigArena" ? (
                      <span className="text-gold/80">Yes (satellite)</span>
                    ) : (
                      "No — ranks models"
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.pricing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 6 tools, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {TOOLS.map((t, i) => (
            <article
              key={t.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                t.featured
                  ? "border-gold/40 bg-gold/5"
                  : "border-bg-border bg-bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {t.featured ? (
                    <span className="text-gold">{t.name}</span>
                  ) : (
                    t.name
                  )}
                </h3>
                {t.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    editor&apos;s pick
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it measures
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.measures}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pros
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.pros.map((p) => (
                        <li
                          key={p}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-gold">+</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Cons
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.cons.map((c) => (
                        <li
                          key={c}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-text-muted">−</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pricing
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.pricing}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Best for
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The verdict
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you want to know which model humans prefer, LMSYS Chatbot Arena
          will tell you. If you want to know which model writes better code,
          BigCode will tell you. If you want to know which open model scores
          best on general benchmarks, Hugging Face will tell you. But if you
          want to know where <strong className="text-text-primary">you</strong>{" "}
          rank among the humans who drive AI — whether your cascade is
          compounding or burning — SigRank is the only independent leaderboard
          that ranks operators. SigArena is its satellite, same methodology in
          an arena format.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Install the CLI, submit a snapshot, and see your class tier on the
          live leaderboard:{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-mono text-sm font-bold text-text-primary">
                {f.question}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
          </Link>
          {" · "}
          <Link
            href="/alternatives/ai-coding-efficiency-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Efficiency Tools
          </Link>
          {" · "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            vs LMSYS Arena
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-compare-ai-operators"
            className="text-gold underline underline-offset-2"
          >
            How to Compare AI Operators
          </Link>
        </p>
      </section>
    </div>
  );
}
