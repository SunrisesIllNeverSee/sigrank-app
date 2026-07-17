---
type: article
title: "Volume Isn't Yield: The Shape of AI Operators"
description: SigRank, a measurement layer for how humans operate AI coding agents. What the margins reveal about how 1,628 operators actually use LLMs. Benford validation, 8 archetypes (7 human + outliers), and the cascade economy.
tags: [article, sigrank, benford, clustering, archetypes, human-center-of-mass, cascade, ai-operators, measurement]
timestamp: 2026-07-14T09:00:00Z
author: Deric (@SunrisesIllNeverSee)
hero: /article-charts/03-volume-vs-yield.png
---

# Volume Isn't Yield: The Shape of AI Operators

> [1] We ranked 1,628 AI coding operators by token volume. Then we measured what they actually *did* with those tokens. The field separates into 8 archetypes — 7 human clusters plus an 8th for outliers. The median operator gets 19x more signal from cache than they put in as input. The shape is not what you'd expect.

---

## Why SigRank Exists

[2] Operator leaderboards rank by volume. Total tokens. Who burned the most. It's the only metric anyone publishes, and it's the wrong one.

[3] Volume tells you who spent the most. It doesn't tell you who's good. An operator dumping 9 quadrillion tokens of synthetic input (99.999943% input, near-zero output, zero cache reuse) ranks #1 on every volume-based leaderboard. That's not a power user. That's an outlier.

[4] The question isn't "who has the most tokens?" It's "what did they do with them?"

[5] SigRank measures the **cascade**: the flow of tokens through four pillars. Input is fresh context an operator provides. Output is what the model generates. Cache write is context committed for reuse. Cache read is context pulled back on subsequent turns. The cascade is where efficiency lives. An operator who builds good cache and reads it 20x per unit of input is fundamentally different from one who dumps raw input every turn and never compounds.

[6] The core metric is **Yield**:

```
Y = (cache_read × output) / input^2
```

[7] Yield rewards building cache that produces output. Volume rewards burning tokens. They're not correlated. They're often inversely correlated. That's the whole thesis.

> **Why input is squared.** Input appears in the denominator as input², not input. This is deliberate: an operator who provides almost no fresh context shouldn't score well just because their denominator is tiny. The square penalizes near-zero input sharply — which is exactly the signal we want, since operators with near-zero input are either (a) outliers replaying cache or (b) extreme humans whose cached context is so efficient they barely need to type. The gray-zone filter (see [15a]) separates those two cases. Without the square, yield would scale linearly with 1/input, making the metric trivially gameable by minimizing input rather than maximizing cache compounding.

## What the Numbers Show

[8] Once you measure the cascade instead of the total, you can see the **shape** of the field. SigRank analyzed 1,628 operators from public AI coding agent leaderboards and ran the cascade math on every one of them.

[9] The first thing the margins show: **92.4% of the median operator's tokens are cache reads.** Not input. Not output. Cache reads. The typical operator is not typing new prompts; they're reusing cached context. That's the economy. Input is 5.0%. Output is 0.5%. Cache write is 1.6%. The rest (the overwhelming majority) is cache read.

| Pillar | Median % | What it means |
|--------|----------|---------------|
| Cache Read | 92.4% | Reused context, the harvest |
| Input | 5.0% | Fresh tokens an operator provides |
| Cache Write | 1.6% | Context committed for reuse |
| Output | 0.5% | What the model generates |

> **Rounding note.** Percentages are median-of-ratios — each operator's pillar share is computed individually, then the median across all 1,498 Human Center of Mass operators is reported. Pillar medians may not sum to exactly 100% because medians don't commute with sums. All ratios in this article (operating ratio, leverage, velocity) are median-of-ratios, not ratio-of-medians; the two diverge when distributions are skewed.

[10] This is why volume is misleading. An operator with 5 billion total tokens might have only 200 million tokens of actual input; the rest is cache replay. They're not "using" 5 billion tokens. They're using 200 million and compounding it.

## Can the Data Be Trusted?

[11] Before analyzing anything, the telemetry had to be verified as real. Operator leaderboards are trivially gameable: fabricate token counts, replay cache, inflate your rank. So SigRank ran **Benford's Law** on the raw data.

[12] Benford's Law is the mathematical principle that in naturally occurring datasets, the leading digit follows a logarithmic distribution. Digit 1 appears ~30% of the time. Digit 9 appears ~4.6%. It shows up in tax returns, river lengths, population counts, and stock prices. The IRS uses it to detect fraud. Outliers don't follow Benford. Real telemetry does.

[13] A proper chi-square goodness-of-fit test was run on all 5 raw token pillars: input, output, cache read, cache write, total. Degrees of freedom 8, critical value 15.51 at p=0.05.

![Benford's Law Validation](/article-charts/01-benford-law.png)

| Pillar | N | chi-sq | Verdict |
|--------|---|--------|---------|
| Input tokens | 1,628 | 1.65 | PASS |
| Output tokens | 1,628 | 5.54 | PASS |
| Cache Read | 1,608 | 4.09 | PASS |
| Cache Write | 1,482 | 5.47 | PASS |
| Total tokens | 1,628 | 0.77 | PASS |

> **Why N is smaller for Cache Read and Cache Write.** 3 operators had zero cache read and 129 had zero cache write — no leading digit to test, so they're excluded from that pillar's chi-square only. All other pillars use the full 1,628.

[14] All 5 pillars pass. The observed first-digit distribution matches the expected Benford distribution almost perfectly. This is real telemetry, not fabricated.

[15] **But aggregate Benford isn't enough.** It proves the dataset isn't wholesale fabricated; it doesn't catch individual outliers hiding in the tails. So a complementary test was added: the input/total ratio. Real humans have a healthy mix of fresh input and cache reuse. Outliers don't.

![Outlier Detection: Input/Total Ratio](/article-charts/06-outlier-zones.png)

| Zone | Signal | Count | % | What they're doing |
|------|--------|-------|---|-------------------|
| Zone 0 | input/total < 0.1% | 64 | 4.0% | Near-zero input — splits into extreme humans + replay outliers (see [15a]) |
| Zone 1 | input/total > 80% | 11 | 0.7% | Input dumpers, massive input, no cache reuse, yield=0 |
| Gray zone | 0.1–1% | 210 | 13.0% | Low input — splits into MOSES-like humans + extreme outliers (see [15a]) |
| Human | 1–80% | 1,326 | 82.3% | Real operators, healthy input/cache mix |

[15a] **Zone 0 is not all outliers.** This is the critical distinction. Of the 64 operators with input < 0.1%, 51 have real output (median 4M tokens) and real cache writes (median 64M tokens) — they're extreme humans, not flagged outliers. They've built cached context so efficient that they barely need fresh input. The other 13 have near-zero output and near-zero cache writes — they look like replay outliers, just cycling cached context without producing anything. The gray zone (0.1–1% input) splits similarly: 172 operators pass a MOSES-like filter (velocity ≤ 2x, yield ≤ 1,000, real output > 1M, real cache write > 1M) and stay in the Human Center of Mass. 38 fail the filter and join the outliers. The final outlier classification uses a 6-signal score (inhuman throughput, zero cache reads, single-model fixation, zero sessions, anomalous input ratio, near-zero output) — 17 operators score high enough to be flagged as outliers via the 6-signal score and are part of the 113 total outliers, removed from the Human Center of Mass but kept visible in their own category.

**The classification:**

| Category | Count | % | Criteria |
|----------|-------|---|----------|
| Human Center of Mass | 1,498 | 92.0% | Input 1–80%, or gray-zone passing MOSES-like filter |
| Outliers | 113 | 7.0% | 96 extreme humans + 17 flagged outliers (6-signal score) |

[16] 113 operators (7.0%) are outliers. The aggregate Benford passes because 1,498 real operators dominate the first-digit distribution; 113 outliers out of 1,628 is 7.0%, not enough to break the aggregate. But if you don't separate them, they pollute every downstream metric.

[17] **The extreme case:** `grenadeoftacoss` has 9 quadrillion total tokens with 99.999943% being input. That's not a human coding pattern; that's an outlier dumping synthetic input. This single operator skews the field average by 248,000%.

[18] **The outliers don't get deleted.** They get their own category. They rank against each other. The point isn't to pretend they don't exist. The point is to stop letting them set the numbers for everyone else. The 96 extreme-human outliers — extreme humans like `furic` who have real output and real cache construction but near-zero input — get their own toggle on the leaderboard. They're not flagged outliers. They're just not the center of mass.

## The Human Center of Mass

[19] After separating out the 113 outliers, 1,498 operators remain in the **Human Center of Mass**. The field average is meaningless; `grenadeoftacoss` alone skews it by 248,000%. The mean tells nobody anything.

[20] The **median** is the real center. SigRank calls it the **Human Center of Mass**: where real operators naturally cluster, not the average including trillion-token outliers.

![Yield Distribution: Human Center of Mass](/article-charts/02-yield-distribution.png)

| Metric | Median | IQR (25th-75th) |
|--------|--------|-----------------|
| Yield | 1.68 | 0.53 – 7.52 |
| Leverage | 18.6x | 9.7 – 41.2 |
| Velocity | 0.09 | 0.05 – 0.19 |
| SNR | 8.4% | 4.9% – 15.9% |
| Total tokens | 5.28B | 1.78B – 16.0B |
| Compression | 0.924 | 0.902 – 0.973 |

[21] 80% of operators live between 1.8B and 16B total tokens. The median yield is 1.68, meaning the typical operator gets about 1.7x more signal out of their cascade than they put in as input. The top 1% pulls 10,000x or more.

[22] The median leverage is 18.6x. For every token of fresh input, the median operator reads 19 tokens of cached context. That's the cascade economy in one number.

[22a] Three more metrics in the table above need defining. **Velocity** is output divided by input: how much the model generates per token of fresh context. The median is 0.09, meaning 9 tokens of output for every 100 tokens of input. **SNR** (signal-to-noise ratio) is output as a percentage of input plus output: what fraction of the operator's interaction was actual generated signal versus prompt overhead. The median is 8.4%, which makes sense when 92.4% of tokens are cache replay — the cascade is dominated by context reuse, not fresh interaction. **Compression** is the share of total tokens that are cached (cache read + cache write): how much of the operator's world is stored context versus fresh interaction. The median is 0.924, meaning 92.4% of everything an operator touches is cached context they built earlier.

[23] This is where you land when you open SigRank. Not the outliers. The Human Center of Mass. Where you probably are.

## Where the Tokens Go

[24] The pillars flow in a cascade: input seeds context, output is generated, cache is written for reuse, cache is read back on subsequent turns. Here's where the median operator's 5.28 billion tokens actually go:

```
Human Input:     238M tokens   (5.0%)
     |
     v
Output:           24M tokens   (0.5%)
     |
     v
Cache Write:      72M tokens   (1.6%)
     |
     v
Cache Read:      4.77B tokens  (92.4%)
```

[25] 92.4% cache read. That's the economy. The typical operator isn't typing new prompts; they're reusing cached context.

[26] The **operating ratio** compresses this into one number. For the median operator:

```
C : I : O = 19 : 1 : 0.09
```

[27] 19 tokens of cache read for every 1 token of input. 0.09 tokens of output for every 1 token of input. That's the median operator's fingerprint: extreme cache reuse, modest output, tiny fresh input. The cascade rewards building cache that compounds, not burning tokens.

[28] This is why volume != yield. An operator with 10 trillion tokens and 0.01x yield is less efficient than an operator with 1 billion tokens and 1,000x yield. The first is pumping. The second is compounding.

![Volume vs Yield: The Central Finding](/article-charts/03-volume-vs-yield.png)

[29] Volume-based leaderboards rank by total tokens. SigRank ranks by yield. The 50 ghost-rank operators (below the volume median but above the yield median) are invisible on every volume-based leaderboard. SigRank is the only place that surfaces them. Take `grishin43` (Grishin Vlad): ranked 1,142nd by volume with 2.07B total tokens, but yield of 839,628. That's 497,000x the median yield, hidden at position 1,142 on a volume board. On SigRank, that operator is near the top. Volume says "irrelevant." Yield says "elite."

## The 8 Archetypes

[30] K-Means clustering was run on the 1,498 Human Center of Mass operators. Not to invent categories; to discover what's already there. The method: cluster on log(yield, leverage, velocity, SNR) to find yield tiers, then cluster on token composition proportions (input%, output%, cache_read%, cache_write%) to find shapes within each tier. The two-stage hierarchy is collapsed to a flat list here for readability; the full tier structure is on the [methodology page](/methodology).

[31] **8 archetypes emerged** from the clustering and outlier analysis. 7 human archetypes came from K-Means on the 1,498 Human Center of Mass operators. The 8th — Outliers — comes from the input/total ratio analysis (see [15a]), which flags 96 extreme humans and 17 flagged outliers from the full 1,628. Some outliers like `furic` also appear in the Cache Architects archetype; the 8th category captures what's too extreme to set the median for everyone else. Silhouette score 0.625, which is "good structure," not noise.

![7 Human Archetypes: Token Composition](/article-charts/04-archetype-composition.png)

### The Field (n=963, 59.8%)
[32] The human center of mass. Yield 1.24, leverage 15.7x. Composition: 5.9% input, 0.4% output, 92.7% cache read, 0.8% cache write. These are the majority; consistent cache reuse, moderate yield, finding their rhythm. If you use AI coding agents, this is probably you. Examples: `Xavierhorwood` (4.91B tokens, 0.73% input, 95.9% cache read), `LeeByeongMuk`, `journeyWorker`, `tellang` (18.7B tokens, 4.1% input, 92.9% cache read, yield 2.4), `ShivamB25` (29.2B tokens, 5.3% input, 92.0% cache read, yield 1.2).

### Context Builders (n=313, 19.4%)
[33] Moderate yield (6.71), but with a difference: they're actively building cache. 4.8% of their tokens go to cache writes, 6x more than The Field. They're investing in context construction, and it's paying off with 5x higher yield. Examples: `gwbiubiu` (1.66B tokens, 0.94% input, 4% cache writes), `shivang2000`, `YoannLetacq`, `amondnet` (40.7B tokens, 0.22% input, 7.7% cache writes, yield 165), `trin4ik` (12.7B tokens, 1.6% input, 2.8% cache writes, yield 10.6).

### Cache Architects (n=137, 8.5%)
[34] Extreme cache reuse. 96.6% of their tokens are cache reads. Near-zero fresh input (0.3%). Yield 444, 360x The Field. These operators have built such efficient cached context that they barely need fresh input. They're not pumping tokens; they're compounding them. Examples: `furic` (6.72B tokens, 0.003% input, 96.8% cache read), `younhomaeng-svg`, `grishin43`, `tomashrdlicka` (3.55B tokens, 0.28% input, 95.7% cache read, yield 135), `kevinelliott` (24.7B tokens, 0.56% input, 97.0% cache read, yield 84).

![8 Archetypes: Distribution Across the Field](/article-charts/26-eight-categories-donut.png)

### Input-Heavy Operators (n=102, 6.3%)
[35] 43% of their tokens are input. Only 54% cache read. Yield 0.02, effectively zero. These operators are dumping tokens in without building cache. They're the opposite of Cache Architects. Whether they're beginners, using tools that don't support caching, or just inefficient, their cascade isn't compounding. Examples: `wuwangzhang1216` (487B tokens, 33.7% input, 60.9% cache read), `jake8655`, `gaorf30153`, `Gioxaa` (18.5B tokens, 27% input, 72% cache read, yield 0.003), `bnmbanhmi` (2.56B tokens, 56% input, 44% cache read, yield 0).

### Cache Builders (n=46, 2.9%)
[36] The elite. Yield 1,825. Leverage 915x. 7% cache writes, they're not just reading cache, they're actively constructing it. And it's working: 915x leverage means every token of input generates 915 tokens of cached context. These are the cascade masters. Examples: `gabsh` (253M tokens, 0.01% input, 5.2% cache writes), `marquis08`, `typark96`, `hiiamtrong` (1.78B tokens, 0.12% input, 5.3% cache writes, yield 757), `j3566` (5.44B tokens, 0.34% input, 3.6% cache writes, yield 507).

### Cascade Operators (n=46, 2.9%)
[37] High yield (135) through balance, not extreme on any one dimension. 140x leverage, 0.99 velocity, 94% cache read, 4% cache write. They're efficient across the board, not relying on a single trick. Examples: `honggilgim` (7.2M tokens, 0.01% input, 96.4% cache read), `henmmi`, `shpark-daim`, `632781460` (10.5B tokens, 0.18% input, 97.3% cache read, yield 941, velocity 1.70), `headcha` (1.8B tokens, 0.28% input, 91.6% cache read, yield 291, velocity 0.90).

### Steady Cascaders (n=4, 0.2%)
[38] A rare shape. 24% output, most operators are under 1%. These operators produce proportionally more output than the rest of the field. Yield 13.5, moderate. They're not the highest yield, but their composition is unique. Note: n=4 is small — this cluster is the most likely to dissolve or merge with reclassification. Examples: `rar-file` (9.08B tokens, 6.3% input, 13.3% output, yield 26), `cexll` (214B tokens, 33% input, 30% output, yield 1.0). (The originally listed `sadw1q` has been reclassified as an outlier — 0.14% input and yield of 110,251 places it in the extreme-human zone, not the Human Center of Mass.)

### Outliers (the 8th archetype)

[39] The 113 outliers flagged by the input/total ratio analysis (see [15a]) form the 8th archetype. Some outliers also appear in Cache Architects or Cache Builders — they carry both labels. The 17 flagged outliers don't appear in any human archetype because they were excluded from clustering. Here's what the 8th category catches:

[40] **Outliers (96 operators):** Extreme cache reuse. Input is near-zero (median 1.4M tokens, 0.075% of total) but output and cache writes are real: median 5M output, 76M cache write, 1.8B cache read. Yield 5,237. Leverage 1,282x. These are operators like `furic`, who have built such efficient cached context that they barely need fresh input. They have real output and real cache construction. They're just extreme — too extreme to set the median for everyone else. Examples: `furic` (6.72B tokens, 0.003% input, yield 2.46M), `grishin43` (2.07B tokens, 0.006% input, yield 839K), `gabsh` (253M tokens, 0.014% input, yield 302K), `MaykThewessen` (6.41B tokens, 0.012% input, yield 254K), `shpark-daim` (260M tokens, 0.022% input, yield 197K).

[41] **Flagged outliers (17 operators):** Two extreme outliers — `grenadeoftacoss` (9 quadrillion tokens, 99.999943% input, near-zero output) and `stelle-w` (450B tokens, 75% input, 25% output, zero cache). Plus 15 more flagged by a multi-signal outlier score (3–4 signals): anomalous token ratios that don't match human patterns but aren't as clear-cut as the extreme outliers. Examples: `iamtheavoc1` (7T tokens, 14% input, 18% output, 64% cache read — flagged, score 4), `logcjj` (115B tokens, 52% input, near-zero yield — flagged, score 3).

[42] Not deleted, categorized. They get their own toggle on the leaderboard. They rank against each other. The point isn't to pretend they don't exist. The point is to stop letting them set the numbers for everyone else.

### What Each Type Looks Like

[42a] To make this concrete, here's what the cascade composition actually looks like for representative operators from each archetype. The numbers are real — pulled from the live leaderboard.

| Archetype | Example | Total | Input % | Output % | Cache Write % | Cache Read % | Yield |
|-----------|---------|-------|---------|----------|---------------|--------------|-------|
| The Field | `Xavierhorwood` | 4.91B | 0.73% | 0.3% | 0.8% | 95.9% | ~1 |
| Context Builders | `gwbiubiu` | 1.66B | 0.94% | 0.4% | 4.0% | 90% | ~7 |
| Cache Architects | `furic` | 6.72B | 0.003% | 0.05% | 1.0% | 96.8% | 444 |
| Input-Heavy | `wuwangzhang1216` | 487B | 33.7% | 0.2% | 1.0% | 60.9% | 0.02 |
| Cache Builders | `gabsh` | 253M | 0.01% | 0.3% | 5.2% | 90% | 1,825 |
| Cascade Operators | `honggilgim` | 7.2M | 0.01% | 1.0% | 4.0% | 96.4% | 135 |
| Outlier | `sadw1q` | 17.75B | 0.14% | 30% | 2.0% | 67% | 110,251 |
| Outlier (input dump) | `grenadeoftacoss` | 9Q | 99.9999% | ~0% | ~0% | ~0% | 0 |

[42b] Read the table left to right and the shape jumps out. The Field operator puts in 0.73% fresh input and reads 95.9% cache — a 130:1 read-to-input ratio. The Cache Architect puts in 0.003% — one fresh token for every 30,000 cache reads. The Input-Heavy operator flips the pattern: 33.7% input, only 60.9% cache, yield near zero. The flagged outlier is just noise: 9 quadrillion tokens, 99.9999% input, zero compounding. The outlier (`sadw1q`) is the strangest shape — 30% output, which is 60x higher than the field median. That's why it's flagged as an extreme-human outlier, not a flagged outlier: it has real output, just at a composition nobody else hits.

## Notes from Building This

[43] A few things came up while putting this together. Less data observations, more lessons from the build:

1. **Tell one story, not six.** The page should walk a reader from "What is this?" to "Why does it happen?" to "Can I trust it?", not answer six questions simultaneously.

2. **Percentiles, not averages.** Operators don't care about the field average. They care about where they sit. Show percentile bands with a "YOU" marker. Athletic performance sites do this. It's addictive.

3. **The Human Center of Mass.** This phrase stuck. Not "field average including trillion-token outliers" but "where real operators naturally cluster." That's the thing people remember.

4. **The data naturally separates into 8 archetypes.** Not "8 operator types were invented." The 7 human clusters emerged from unsupervised K-Means; the 8th (outliers) emerged from the input/total ratio analysis. The groups emerged from the data, not from interpretation. That's a huge credibility difference.

5. **This is something that doesn't exist yet.** GitHub measures commits. Stack Overflow measured reputation. Kaggle measures competitions. SigRank measures operator behavior, not models, not benchmarks, humans operating models. That's genuinely a different domain.

## What's Next

[44] **The [field page](/field) is live.** It shows the distribution, the 8 archetypes, the percentile bands, the cascade flow, the outlier zone, and the Benford trust badge. One story: Volume != Yield. You land on the Human Center of Mass and see where you fit.

[45] **The [methodology page](/methodology) is live.** Full chi-square tables, the outlier detection algorithm, the clustering methodology, the provenance chain. This is the citation target, the place where "can I trust this?" gets answered.

[46] **Phase 3: The Dataset.** Upload to Zenodo, get a DOI, register DataCite metadata. The dataset becomes formally citable in academic papers.

[47] **Phase 4: The Paper.** "Benford's Law and Token Ratio Analysis for Outlier Detection in AI Coding Agent Leaderboards." The data is done. The analysis is done. It's writing time.

## Why This Matters

[48] Operator leaderboards for AI coding are new. Nobody has figured out how to verify that the numbers are real. Benford's Law has been used for social bots, academic fraud, and forensic accounting, but never for LLM token telemetry. If this works (and the aggregate data says it does), it becomes the standard verification layer for any operator leaderboard.

[49] GitHub measures commits. Stack Overflow measured reputation. Kaggle measures competitions. SigRank measures the cascade: how humans operate AI models, not how models perform on benchmarks. That's a different domain, and it doesn't have a standard yet.

[50] The dataset is real. The outliers are categorized, not hidden. The archetypes emerged. The methodology is sound.

[51] Volume isn't yield. The cascade economy rewards compounding, not pumping. And the shape of AI operators is not what you'd expect: it's a power law with a human center of mass, a hidden elite of cache architects, and a long tail of input-heavy operators still finding their footing.

[52] This is the first cut. 1,628 operators, one snapshot, one leaderboard. The methodology scales — the cascade math works on any token telemetry source, and the outlier detection framework generalizes to any operator leaderboard that exposes the four pillars. Next: longitudinal analysis (how operators move between archetypes over time), cross-platform comparison (does a Cache Architect on Anthropic look the same as one on OpenAI?), and the formal paper with full chi-square tables, clustering methodology, and the provenance chain. The dataset will be on Zenodo with a DOI. The field is young. The measurement layer is just being built.

---

*Data: 1,628 classified operators (1,628 scraped, 113 outliers separated, 1,498 Human Center of Mass) from public AI coding agent leaderboards (2026-07-13)*
*Analysis: Benford chi-square (scipy), K-Means clustering (scikit-learn), outlier detection (6-signal score + input/total ratio)*
*Tool: SigRank, `npx sigrank` on npm*
*Live board: [signalaf.com](https://signalaf.com) · [Field analysis](/field) · [Methodology](/methodology) · [Leaderboard](/board/all)*
*Dataset: available for academic use (Zenodo upload pending)*

---

*This work is part of a broader research program on [Commitment Theory](https://github.com/SunrisesIllNeverSee/Commitment_Theory) — a 34-paper investigation into how governance structures emerge from measurable behavior in autonomous systems. SigRank applies the same principle to AI operators: you don't measure trust by asking, you measure it by observing the cascade.*

*- djm · [MO§ES™](https://mos2es.com)*
*[@burnmydays on X](https://x.com/burnmydays) · [GitHub](https://github.com/SunrisesIllNeverSee)*
