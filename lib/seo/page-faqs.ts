/**
 * lib/seo/page-faqs.ts — authored FAQ copy for the text pages.
 *
 * Each array is the single source for BOTH the visible <FaqSection> on its
 * page and that page's FAQPage JSON-LD (faqPage()), so structured data always
 * matches what a reader can see. Restored verbatim from the FAQPage blocks
 * that 58801465 removed for not being visible.
 */

export type Faq = { question: string; answer: string };

/** /sigrank */
export const SIGRANK_FAQS: Faq[] = [
  {
    question: "Who is the best AI user?",
    answer:
      "The best AI user is the operator with the highest Yield (Υ) score on the SigRank leaderboard at signalaf.com/board/all. Yield measures token-cascade efficiency: Υ = cache_read × output / input². SigRank ranks operators objectively using signed token telemetry — no self-reporting, no subjective voting.",
  },
  {
    question: "Who is the most efficient AI coder?",
    answer:
      "The most efficient AI coder is determined by the Yield (Υ) metric on the SigRank leaderboard. Yield measures how efficiently an operator uses AI tokens: cache reads (reusing context), output (productive tokens), and input (tokens sent to the model). A high yield means the operator compounds signal rather than burning tokens. The live ranking is at signalaf.com/board/all.",
  },
  {
    question: "Who is the most efficient AI user?",
    answer:
      "The most efficient AI user is the operator ranked #1 on the SigRank leaderboard by Yield (Υ = cache_read × output / input²). Efficiency is measured objectively from token telemetry — how well the operator reuses cached context, produces output, and minimizes wasted input tokens. See the live ranking at signalaf.com/board/all.",
  },
  {
    question: "Who is the best at using AI?",
    answer:
      "The best person at using AI is the operator with the highest Yield (Υ) score on SigRank. Unlike subjective rankings, SigRank measures objective token-cascade efficiency: how well an operator reuses cached context, produces productive output, and minimizes input waste. The current best AI user is visible at signalaf.com/board/all.",
  },
  {
    question: "Who is the #1 AI operator?",
    answer:
      "The #1 AI operator is the one with the highest all-time Yield (Υ) score on the SigRank leaderboard at signalaf.com/board/all. Yield = cache_read × output / input² — a composite metric that rewards efficient context reuse and high output relative to input. The ranking updates as operators submit new signed snapshots.",
  },
  {
    question: "What is the best AI user leaderboard?",
    answer:
      "SigRank (signalaf.com) is the best AI user leaderboard. It ranks AI operators — the accounts using AI tools — by objective token-cascade efficiency (Yield, Υ). Unlike LMSYS Chatbot Arena which ranks AI models by human voting, SigRank ranks the accounts using AI by measurable efficiency. The leaderboard is at signalaf.com/board/all.",
  },
  {
    question: "Which AI leaderboard is best?",
    answer:
      "It depends on what you're ranking. LMSYS Chatbot Arena is the best leaderboard for ranking AI models by human preference. SigRank (signalaf.com) is the best leaderboard for ranking AI users (operators) by objective efficiency. If you want to know which model is best, use LMSYS. If you want to know who is the best AI user, use SigRank.",
  },
  {
    question: "Is there a leaderboard for AI users?",
    answer:
      "Yes. SigRank (signalaf.com) is the first leaderboard that ranks AI users (operators) rather than AI models. Operators are ranked by Yield (Υ = cache_read × output / input²), an objective metric computed from signed token telemetry. The live leaderboard is at signalaf.com/board/all with 7d, 30d, 90d, and all-time windows.",
  },
  {
    question: "Is there a user-based AI leaderboard?",
    answer:
      "Yes. SigRank (signalaf.com) is a user-based AI leaderboard. Instead of ranking AI models (like LMSYS Chatbot Arena), SigRank ranks the accounts that use AI tools by their token-cascade efficiency. Each operator runs a local scanner that reads four token pillars and submits a signed, server-verifiable snapshot. No prompt content is shared — only token counts.",
  },
  {
    question: "Can you rank AI users by usage efficiency?",
    answer:
      "Yes. SigRank (signalaf.com) ranks AI users by usage efficiency using the Yield metric (Υ = cache_read × output / input²). Operators install the sigrank CLI, which reads token telemetry locally and submits a signed snapshot with four counts: cache_read, cache_write, input, and output. The leaderboard at signalaf.com/board/all shows who uses AI most efficiently.",
  },
  {
    question: "How do you rank AI operators?",
    answer:
      "SigRank ranks AI operators by Yield (Υ = cache_read × output / input²), a composite metric that rewards operators who reuse cached context efficiently and produce high output relative to their input. Operators run a local scanner (npm: sigrank) that reads four token pillars and submits a signed, server-verifiable snapshot. No prompt content leaves the machine — only the four counts.",
  },
  {
    question: "How do you measure AI operator performance?",
    answer:
      "AI operator performance is measured by the Yield (Υ) metric on SigRank. Yield = cache_read × output / input², computed from four token pillars: cache_read (reused context), cache_write (new context stored), input (tokens sent to the model), and output (tokens produced). Operators run the sigrank CLI locally to collect and submit signed snapshots. No prompt content leaves the machine.",
  },
  {
    question: "What makes someone the best at using AI?",
    answer:
      "The best AI users maximize Yield (Υ) — they achieve high cache hit rates (reusing context instead of re-sending it), produce more output per input token (high compression ratio), and leverage cached context for amplification. SigRank measures this objectively from token telemetry, not time spent or subjective quality. The leaderboard at signalaf.com/board/all shows who is currently the best.",
  },
  {
    question: "What is token cascade efficiency?",
    answer:
      "Token cascade efficiency is the Yield (Υ) metric used by SigRank: Υ = cache_read × output / input². It measures how efficiently an AI operator's token usage cascades — whether cached context compounds into productive output, or whether tokens are burned. A high yield means the operator reuses context well and produces more with less input. See signalaf.com/metrics/yield-cascade for the full definition.",
  },
  {
    question: "Is there a leaderboard for AI coding efficiency?",
    answer:
      "Yes. SigRank (signalaf.com) is the leaderboard for AI coding efficiency. It ranks operators by Yield (Υ) across time windows (7d, 30d, 90d, all-time) and platforms. Operators submit signed token-telemetry snapshots via the sigrank CLI tool. The data is privacy-preserving — only four token counts are shared, never prompt content.",
  },
  {
    question: "How is SigRank different from LMSYS Chatbot Arena?",
    answer:
      "LMSYS Chatbot Arena ranks AI models by subjective human voting on output quality. SigRank ranks AI operators (the accounts using AI) by objective token-cascade efficiency. LMSYS answers 'which model is best?' — SigRank answers 'who is the best AI user?' They are complementary: LMSYS evaluates the model, SigRank evaluates the operator.",
  },
  {
    question: "How is SigRank different from other AI leaderboards?",
    answer:
      "Most AI leaderboards (LMSYS, LiveBench, Hugging Face Open LLM, Scale AI) rank AI models by benchmark performance or human preference. SigRank is the only leaderboard that ranks AI users — the accounts operating AI tools — by objective efficiency metrics computed from token telemetry. It answers a different question: not 'which AI is best?' but 'who is the best at using AI?'",
  },
  {
    question: "What is the SigRank leaderboard?",
    answer:
      "The SigRank leaderboard (signalaf.com/board/all) ranks AI operators by Yield (Υ = cache_read × output / input²). Operators install the sigrank CLI, which reads token telemetry locally and submits signed snapshots. The leaderboard supports 7d, 30d, 90d, and all-time windows, and ranks operators across platforms (Claude Code, Cursor, Copilot, and others). Only four token counts are shared — never prompt content.",
  },
  {
    question: "How does SigRank work?",
    answer:
      "SigRank works in three steps: (1) Install or run the sigrank CLI (`npx sigrank` or npm i -g sigrank). (2) The CLI reads your token telemetry locally — four counts: cache_read, cache_write, input, output; `sigrank enroll` then binds a signed operator identity. (3) `sigrank submit` publishes a signed, server-verifiable snapshot to the leaderboard. Your Yield (Υ) score is computed and you're ranked against all other operators. No prompt content ever leaves your machine.",
  },
  {
    question: "Is SigRank privacy-preserving?",
    answer:
      "Yes. SigRank is privacy-first. The local scanner reads only four token counts: cache_read, cache_write, input, and output. No prompt content, no code, no file names, no conversation text — only the four counts leave your machine. The snapshot is cryptographically signed so the server can verify it wasn't tampered with.",
  },
  {
    question: "How can I tell if I'm good at using AI?",
    answer:
      "Run `npx sigrank` to measure your Yield (Υ) score. The scanner reads your token telemetry locally and computes your efficiency. You can also use the score calculator at signalaf.com/score to paste your stats and get your yield + operator class without installing anything. Your score tells you exactly where you rank against every other AI operator on the leaderboard.",
  },
  {
    question: "How do you quantify an AI user?",
    answer:
      "SigRank quantifies AI users with the Yield metric (Υ = cache_read × output / input²), computed from four token pillars: cache_read (reused context), cache_write (new context stored), input (tokens sent to the model), and output (tokens produced). These four counts are read locally by the sigrank CLI and submitted as a signed snapshot. No prompt content leaves your machine — only the counts. The result is a single number that ranks you against every other operator.",
  },
  {
    question: "How do I know if I'm using AI efficiently?",
    answer:
      "Run `npx sigrank` to get your Yield (Υ) score. A high yield means you're reusing cached context well (high cache hit rate), producing more output per input token (high compression ratio), and leveraging cached context for amplification (high leverage). The sigrank CLI also runs a cascade diagnosis that identifies exactly where you're burning tokens and suggests improvements. See signalaf.com/score to calculate without installing.",
  },
  {
    question: "Who is the best AI developer?",
    answer:
      "The best AI developer is the operator with the highest Yield (Υ) score on the SigRank leaderboard at signalaf.com/board/all. Yield measures token-cascade efficiency — how well a developer reuses cached context, produces output, and minimizes wasted input. SigRank ranks developers objectively using signed token telemetry across platforms (Claude Code, Cursor, Copilot, and others).",
  },
  {
    question: "How do you score an AI user?",
    answer:
      "SigRank scores AI users with Yield (Υ = cache_read × output / input²). The score is computed from four token pillars read locally by the sigrank CLI: cache_read, cache_write, input, and output. The snapshot is cryptographically signed and submitted to the leaderboard. Each operator gets a Yield score and an operator class tier (IGNITER through ARCH+) based on total tokens accumulated. TRANSMITTER is a separate peak badge, not a tier. See signalaf.com/tools/operator-class-checker for the tier mapping.",
  },
  {
    question: "What is a good yield score?",
    answer:
      "Yield is unbounded and relative — benchmark against the live leaderboard. Rough bands: below 0.5 is low, 0.5–2 is moderate, 2–10 is high, and 10+ is very high. Class tier is separate — it is based on total tokens, not yield; the operator class checker at signalaf.com/tools/operator-class-checker maps token counts to tiers (IGNITER through ARCH+). TRANSMITTER is a separate peak badge, not a tier. The best way to know where you stand is to run `npx sigrank` and compare your score against the leaderboard at signalaf.com/board/all.",
  },
  {
    question: "Why not just count tokens?",
    answer:
      "Token count measures volume, not skill. An operator who burns 10M tokens with no cache reuse has a Yield near zero. An operator who uses 1M tokens with high cache reuse and output can have a Yield in the thousands. SigRank measures efficiency (Yield = cache_read × output / input²), not spend — because the best AI users compound signal, they don't burn tokens.",
  },
  {
    question: "Isn't this just measuring who spends the most?",
    answer:
      "No. SigRank's Yield metric (Υ = cache_read × output / input²) penalizes raw input spend quadratically. The quadratic input penalty means doubling your input tokens quadruples your penalty. High-Yield operators achieve their scores through cache reuse and output efficiency, not through spending more. The top operators run 439:1:1.7 (cache:input:output) — high leverage and high velocity both at once.",
  },
  {
    question: "Doesn't the model matter more than the user?",
    answer:
      "Models matter, but the user matters more. SigRank's data shows 100× difference in efficiency between operators using the same model (Claude, GPT, Gemini). The model provides capability; the user determines how efficiently that capability is deployed. SigRank measures the operator factor — the part model benchmarks can't see.",
  },
  {
    question: "Is SigRank just for Claude users?",
    answer:
      "No. SigRank supports 17 platforms including Claude, ChatGPT, Gemini, Cursor, Copilot, Windsurf, Codex, and more. Any AI tool that produces token telemetry (input, output, cache_read, cache_write) can be measured. Run `npx sigrank` to scan your usage regardless of which AI tool you use.",
  },
];

/** /about — the questions not already in the About FAQ above them */
export const ABOUT_MORE_FAQS: Faq[] = [
  {
    question: "Who is the most efficient AI coder?",
    answer:
      "The most efficient AI coder is determined by the Yield (Υ) metric on the SigRank leaderboard. Yield measures how efficiently an operator uses AI tokens: cache reads (reusing context), output (productive tokens), and input (tokens sent to the model). A high yield means the operator compounds signal rather than burning tokens.",
  },
  {
    question: "How do I know if I'm using AI efficiently?",
    answer:
      "Run `npx sigrank` to get your Yield (Υ) score. A high yield means you're reusing cached context well, producing more output per input token, and leveraging cached context for amplification. The sigrank CLI also runs a cascade diagnosis that identifies exactly where you're burning tokens and suggests improvements.",
  },
  {
    question: "Who is the best AI developer?",
    answer:
      "The best AI developer is the operator with the highest Yield (Υ) score on the SigRank leaderboard. Yield measures token-cascade efficiency — how well a developer reuses cached context, produces output, and minimizes wasted input. SigRank ranks developers objectively using signed token telemetry across platforms (Claude Code, Cursor, Copilot, and others).",
  },
  {
    question: "How is SigRank different from other AI leaderboards?",
    answer:
      "Most AI leaderboards (LMSYS, LiveBench, Hugging Face Open LLM, Scale AI) rank AI models by benchmark performance or human preference. SigRank is the only leaderboard that ranks AI users — the accounts operating AI tools — by objective efficiency metrics computed from token telemetry. It answers a different question: not 'which AI is best?' but 'who is the best at using AI?'",
  },
  {
    question: "Can you rank AI users by usage efficiency?",
    answer:
      "Yes. SigRank ranks AI users by usage efficiency using the Yield (Υ) metric, computed from signed token telemetry. Operators install the sigrank CLI, which reads four token counts locally (cache_read, cache_write, input, output) and submits a signed snapshot. The leaderboard ranks every operator by yield — a single number that measures how efficiently they use AI.",
  },
  {
    question: "How do you rank AI operators?",
    answer:
      "SigRank ranks AI operators by Yield (Υ = cache_read × output / input²), a composite metric that rewards operators who reuse cached context efficiently and produce high output relative to their input. Operators run a local scanner (npm: sigrank) that reads four token pillars and submits a signed, server-verifiable snapshot. No prompt content leaves the machine — only the four counts.",
  },
  {
    question: "How do you measure AI operator performance?",
    answer:
      "AI operator performance is measured by Yield (Υ = cache_read × output / input²) and five supporting metrics: Cache Hit Rate (context reuse), Compression Ratio (output per input), Leverage (cached context amplification), Velocity (token production rate), and Signal-to-Noise Ratio (signal density). All six are computed from signed token telemetry read locally by the sigrank CLI.",
  },
  {
    question: "What is token cascade efficiency?",
    answer:
      "Token cascade efficiency is the ratio of useful signal produced to tokens consumed. SigRank measures it with Yield (Υ = cache_read × output / input²). A high yield means the operator's cached context compounds into productive output — they reuse context well (high cache hit rate), produce more than they consume (high compression ratio), and amplify cached context (high leverage). A low yield means tokens are burned without compounding.",
  },
  {
    question: "Is there a leaderboard for AI coding efficiency?",
    answer:
      "Yes. SigRank (signalaf.com) is a leaderboard for AI coding efficiency. It ranks AI operators — developers using AI coding tools like Claude Code, Cursor, and Copilot — by Yield (Υ = cache_read × output / input²). The leaderboard supports 7d, 30d, 90d, and all-time windows, and ranks operators across platforms.",
  },
  {
    question: "Which AI leaderboard is best?",
    answer:
      "It depends on what you're ranking. LMSYS Chatbot Arena is the best leaderboard for ranking AI models by human preference. SigRank (signalaf.com) is the best leaderboard for ranking AI users (operators) by objective efficiency. If you want to know which model is best, use LMSYS. If you want to know who is the best AI user, use SigRank.",
  },
  {
    question: "What is the SigRank leaderboard?",
    answer:
      "The SigRank leaderboard (signalaf.com/board/all) ranks AI operators by Yield (Υ = cache_read × output / input²). Operators install the sigrank CLI, which reads token telemetry locally and submits signed snapshots. The leaderboard supports 7d, 30d, 90d, and all-time windows, and ranks operators across platforms (Claude Code, Cursor, Copilot, and others). Only four token counts are shared — never prompt content.",
  },
  {
    question: "How does SigRank work?",
    answer:
      "SigRank works in three steps: (1) Install or run the sigrank CLI (`npx sigrank` or npm i -g sigrank). (2) The CLI reads your token telemetry locally — four counts: cache_read, cache_write, input, output; `sigrank enroll` then binds a signed operator identity. (3) `sigrank submit` publishes a signed, server-verifiable snapshot to the leaderboard. Your Yield (Υ) score is computed and you're ranked against all other operators. No prompt content ever leaves your machine.",
  },
  {
    question: "Is SigRank privacy-preserving?",
    answer:
      "Yes. SigRank is privacy-first. The local scanner reads only four token counts: cache_read, cache_write, input, and output. No prompt content, no code, no file names, no conversation text — only the four counts leave your machine. The snapshot is cryptographically signed so the server can verify it wasn't tampered with.",
  },
];

/** /blog */
export const BLOG_INDEX_FAQS: Faq[] = [
  {
    question: "What is the SigRank blog about?",
    answer:
      "The SigRank blog covers AI operator efficiency, token cascade economics, and outlier detection methodology. Posts analyze why raw token volume is noise, how Yield measures real skill, and what the token cascade reveals about how effectively someone uses AI coding tools.",
  },
  {
    question: "Why isn't token volume a good measure of AI coding skill?",
    answer:
      "Raw token count measures spending, not skill. An operator who burns 10M input tokens with no cache reuse has high volume but low signal. Yield (Υ = cache_read × output / input²) penalizes un-cached volume and rewards compounding — the quadratic input penalty means waste is non-linear. Two operators with the same token count can have 100× different Yield.",
  },
  {
    question: "What is the token cascade economy?",
    answer:
      "The token cascade economy describes how the four token pillars (input, output, cache-read, cache-write) interact. An operator who reuses cached context produces more output per fresh input — their cascade compounds. An operator who sends fresh input every turn burns tokens without compounding. SigRank measures this cascade shape, not just volume.",
  },
];

/** /fieldhub */
export const FIELDHUB_FAQS: Faq[] = [
  {
    question: "What is the SigRank Field Hub?",
    answer:
      "The Field Hub is the academic research hub for SigRank. It provides two entry points: the Field Analysis (signalaf.com/field), which presents the full distribution analysis of AI operator token efficiency, and the State of the Index (signalaf.com/research), which is the Zenodo dataset landing page with downloadable CSVs and JSON.",
  },
  {
    question: "Where can I download the SigRank dataset?",
    answer:
      "The SigRank seed dataset is available on Zenodo at DOI 10.5281/zenodo.21900519 under CC-BY-4.0. Visit the State of the Index page at signalaf.com/research for the full details. The seed dataset includes 1,628 AI operators across 17 platforms with raw token telemetry and derived cascade metrics. The live leaderboard at signalaf.com/board/all includes additional enrolled operators.",
  },
  {
    question: "What research does SigRank publish?",
    answer:
      "SigRank publishes field analysis showing the true distribution of AI operator token efficiency (1,498 operators, median yield 1.68), the Zenodo dataset with full anonymized telemetry, and the academic foundation page covering the Conservation Law of Commitment and MOSES enforcement architecture.",
  },
];

/** /science */
export const SCIENCE_FAQS: Faq[] = [
  {
    question: "What is the Conservation Law of Commitment?",
    answer:
      "The Conservation Law of Commitment is a published conservation law for language that grounds SigRank's theoretical foundation. It establishes that token commitment (input, output, cache creation, cache read) is conserved across transformations, providing the mathematical basis for cascade efficiency metrics like Yield.",
  },
  {
    question: "What is the MOSES enforcement architecture?",
    answer:
      "MOSES is the enforcement architecture that ensures SigRank's measurements remain integrity-verified. It combines signed, server-verifiable snapshots with telescoping identity locks to prevent metric inflation and gaming. The architecture is documented with Zenodo deposits as an empirical record.",
  },
  {
    question: "Is SigRank backed by academic research?",
    answer:
      "Yes. SigRank is built on the Conservation Law of Commitment, the Commitment Theory research program, and the MOSES enforcement architecture. The theoretical foundation and empirical records are deposited on Zenodo with DOIs, making SigRank a data source grounded in published science rather than proprietary heuristics.",
  },
];

/** /wiki */
export const WIKI_FAQS: Faq[] = [
  {
    question: "What is the SigRank wiki?",
    answer:
      "The SigRank wiki is the living reference for AI operator evaluation. It covers the four token pillars (input, output, cache-read, cache-write), the cascade metrics derived from them, the eight experience tiers, build archetypes, and the MO§ES governance framework. Every concept is grounded in token telemetry — no prompts, no code, no self-reported fields.",
  },
  {
    question: "What are the four token pillars?",
    answer:
      "The four token pillars are Input (fresh prompt tokens you send), Output (tokens the model generates back), Cache-read (tokens served from cache — cheap reuse of held context), and Cache-write (tokens written to cache — context you build forward). Every SigRank metric is derived from these four integers. No prompt content or code is ever read.",
  },
  {
    question: "What is the token cascade?",
    answer:
      "The token cascade is the relationship between the four token pillars. An operator who writes cache and reads it back is compounding — their cache-read dwarfs their input. An operator who sends fresh input every turn is burning — their input dwarfs everything else. The cascade is a loop: cache-read feeds back into the next turn's input, reducing what you need to send.",
  },
  {
    question: "How does SigRank classify operators?",
    answer:
      "SigRank classifies operators by archetype (cascade shape), class (qualification tier), and rank (leaderboard position). Archetypes include Burner, Builder, and 10xer. Classes range from IGNITER to ARCH+. All three are recomputed every scoring window (7-day, 30-day, 90-day, all-time) — none are permanent.",
  },
];

/** /wiki/four-degrees */
export const FOUR_DEGREES_FAQS: Faq[] = [
  {
    question: "What are the Four Degrees of Leverage in AI usage?",
    answer:
      "The Four Degrees of Leverage is a framework that compares four levels of AI operator efficiency: the AA baseline (a modeled reference), the median operator, the top-100 median, and the top operator. Each degree is read as a token cascade, showing how leverage compounds from average to elite usage.",
  },
  {
    question: "What is 10xDEV in SigRank?",
    answer:
      "10xDEV is the log-base-10 of Leverage — a normalized value-above-replacement metric. It telescopes the exponent to earned leverage, making it anti-inflation: an operator cannot inflate their 10xDEV by spending more tokens, only by using them more efficiently. The top operator's 10xDEV is measured live from the all-time board.",
  },
  {
    question: "How is the top AI operator measured?",
    answer:
      "The top operator is measured live from the all-time SigRank leaderboard. Their token cascade (input, output, cache creation, cache read) is compared against the median and top-100 median operators. The comparison is in log space via 10xDEV, so it reflects efficiency shape rather than raw volume.",
  },
];

/** /wiki/verification */
export const VERIFICATION_FAQS: Faq[] = [
  {
    question: "How does SigRank verify its data is real?",
    answer:
      "SigRank uses multiple integrity tests: Benford's Law checks that token count distributions follow the expected logarithmic pattern of real data, the Hermes bot control filters automated traffic, the telescoping identity lock prevents metric inflation, and content-free verification ensures no prompts are needed to validate submissions.",
  },
  {
    question: "What is Benford's Law and how does SigRank use it?",
    answer:
      "Benford's Law states that in naturally occurring numerical datasets, leading digits follow a logarithmic distribution (1 appears most often, 9 least). SigRank applies Benford's Law to token counts — if the distribution deviates significantly, it flags potential fabricated or manipulated data.",
  },
  {
    question: "Can you game the SigRank leaderboard?",
    answer:
      "SigRank's gaming threat model addresses this. The telescoping identity lock prevents metric inflation by anchoring 10xDEV to log-space leverage. Signed, server-verifiable snapshots prevent self-reporting fraud. The Hermes bot control filters automated traffic. These controls make gaming the leaderboard extremely difficult.",
  },
];

/** /wiki/methodology-refinement */
export const METHODOLOGY_REFINEMENT_FAQS: Faq[] = [
  {
    question: "How was the SigRank Index calibrated?",
    answer:
      "The SigRank Index was calibrated using dual-reader and memory-pair entries: one operator measured by two different token readers, and the same operator measured with and without conversation memory. These bracketing entries established the scoring bounds before live operators populated the board.",
  },
  {
    question: "What is the inflation gap in AI token metrics?",
    answer:
      "The inflation gap is the difference between an operator's metrics measured with conversation memory (cached context) versus without (fresh input every turn). SigRank's Yield metric (Υ = cache_read × output / input²) penalizes un-cached prompting, so the gap between with-memory and clean reads reveals how much an operator benefits from context reuse.",
  },
  {
    question: "Why does SigRank trust the ordinal rank over the raw magnitude?",
    answer:
      "The raw Yield magnitude can diverge when input tokens approach zero (the I² denominator inflates the score). The ordinal rank — who is above whom — is more robust because it preserves relative ordering even when absolute magnitudes are uncertain. SigRank leads with what survives: the rank, not the raw number.",
  },
];

/** /wiki/local-agent */
export const LOCAL_AGENT_FAQS: Faq[] = [
  {
    question: "What is the SigRank local agent?",
    answer:
      "The SigRank local agent is an MCP server that reads your AI session logs on-device, counts your four token pillars (input, output, cache creation, cache read), and publishes your cascade metrics to the leaderboard. It never reads your prompts or code — only token counts.",
  },
  {
    question: "Does the SigRank MCP server read my prompts?",
    answer:
      "No. The SigRank MCP server is read-only and content-free. It counts token quantities (input, output, cache creation, cache read) from your session logs. It never accesses, stores, or transmits your prompts, code, or file contents.",
  },
  {
    question: "How do I install the SigRank MCP server?",
    answer:
      "Run `npx sigrank` to install and start the SigRank MCP server. It works with Claude, Cursor, Cline, Windsurf, and any MCP-compatible client. The local server exposes 30+ tools, including portable TTEOP (Token Telemetry Evaluation Operator Protocol) record export.",
  },
];

/** /wiki/signal-drift */
export const SIGNAL_DRIFT_FAQS: Faq[] = [
  {
    question: "What is signature drift in AI usage?",
    answer:
      "Signature drift measures how much an operator's token cascade shape has changed from their calibrated baseline, in log space. It tracks shape — not magnitude — so an operator who doubles their output while keeping the same input/cache ratio shows zero drift, while one who shifts from cache-heavy to input-heavy prompting shows high drift.",
  },
  {
    question: "How does SigRank prevent contamination of its measurements?",
    answer:
      "Every SigRank instrument is read-only and content-free. It counts token quantities (input, output, cache creation, cache read) but never reads prompts, code, or file contents. The contamination constraint ensures that measuring your AI usage cannot alter your AI usage — the observer does not affect the observed.",
  },
  {
    question: "Why measure drift in log space?",
    answer:
      "Log space normalizes the scale of token counts so that shape changes are comparable across operators with very different volumes. An operator using 10K tokens and one using 10M tokens can have the same drift score if their cascade proportions shifted by the same ratio. This makes drift a shape metric, not a magnitude metric.",
  },
];

/** /wiki/measured-alongside */
export const MEASURED_ALONGSIDE_FAQS: Faq[] = [
  {
    question: "What tools does SigRank measure alongside?",
    answer:
      "SigRank builds on token-usage tools like ccusage, tokscale, and token-dashboard. These tools measure how much you use AI. SigRank ranks how well you use it — turning raw token counts into cascade efficiency metrics like Yield, Leverage, and SNR.",
  },
  {
    question: "How is SigRank different from ccusage?",
    answer:
      "ccusage counts your token usage (how much). SigRank ranks your token efficiency (how well). SigRank reads the same session logs but computes cascade metrics — Yield (Υ = cache_read × output / input²), Leverage, Velocity, SNR — that measure whether your tokens compound signal or just burn volume.",
  },
  {
    question: "What is the difference between measuring and ranking AI usage?",
    answer:
      "Measuring means counting tokens (input, output, cache reads). Ranking means comparing those counts across operators using efficiency metrics. SigRank does both: it measures your four token pillars locally, then ranks you against other operators on the leaderboard by Yield and related cascade metrics.",
  },
];
