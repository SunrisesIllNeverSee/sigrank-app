---
type: article
title: "The Tokens of Babel"
description: The data we receive back from AI systems is primarily encoded in tokens. But different systems report tokens differently. Claude shows you the full cascade. Codex bundles cache writes into input and reports zero. The result is a measurement crisis hiding in plain sight. How the tools, the discrepancies, and the invisible data shape what we can know about operator performance.
tags: [article, sigrank, tokens, telemetry, claude, codex, cache-write, operating-ratios, cascade, measurement, data-gap]
timestamp: 2026-07-15T10:00:00Z
author: Deric (@SunrisesIllNeverSee)
---

# The Tokens of Babel

> [1] Every interaction with an AI model is encoded in tokens. Tokens in, tokens out, tokens cached, tokens read back. The token is the atom of AI operations. But the way these atoms are counted, reported, and summarized varies wildly between systems. And the differences are not cosmetic. They determine what you can know about how someone operates. They determine who looks good and who looks bad. They determine what is visible and what is invisible. This is the story of a measurement crisis hiding in plain sight.

---

## The Problem With Tokens

[2] You run a coding agent. It produces output. How do you know how well you did?

[3] The obvious answer is: look at the tokens. Total tokens. Input tokens. Output tokens. That's what the dashboards show you. That's what the leaderboards rank by. It's the only data anyone publishes.

[4] But tokens are not a single number. They are a cascade. Fresh input goes in. The model generates output. Context gets written to cache for reuse. Cache gets read back on subsequent turns. Four pillars, each telling you something different about how the operator is working.

[5] The problem is that not every system reports all four pillars. And the ones that don't report them have no idea they're missing anything, because the summary looks fine. The total is correct. The input looks reasonable. The output is there. Everything checks out.

[6] Except it doesn't.

## The Tools That Show Tokens

[7] Before we get to the discrepancy, let's look at what exists. Three tools dominate the token visibility space:

[8] **ccusage** is a CLI that reads Claude Code session data from your local machine. It parses the JSONL logs that Claude writes after every session and extracts the four pillars: input, output, cache creation (write), and cache read. It's the gold standard for Claude operators. Every pillar is real, every number is grounded in actual API responses. When ccusage says you wrote 803 million tokens of cache, that's because Claude's API returned `cache_creation_input_tokens: 803500000` in a response. It's not derived. It's not estimated. It's reported.

[9] **token-dashboard** is a local SQLite database tool built by Nate Herkai. It stores token usage over time, giving you longitudinal views. Same data source as ccusage (Claude Code logs), same four pillars, but with history. You can see your cache read growing week over week. You can watch your input shrink as your cached context matures. It's the same telemetry, organized differently.

[10] **tokscale** is a public leaderboard. It aggregates operators across platforms and ranks them. It's where the volume game lives. The biggest spenders are at the top. The operators burning the most tokens are the ones getting the attention. But tokscale, like every volume-based leaderboard, has a problem: it can only rank on what it can see. And what it can see depends on what each platform reports.

[11] These tools are all doing their best with what they have. But they're working with different data sources, different reporting standards, and different levels of completeness. The result is a fragmented landscape where the same operator can look completely different depending on which tool you use and which platform they're on.

## Claude's Readouts: The Full Picture

[12] Claude is the best case. When you use Claude Code, the API returns four distinct numbers for every request:

```
input_tokens:              36,700,000
output_tokens:             54,100,000
cache_creation_input_tokens: 803,500,000
cache_read_input_tokens:  14,600,000,000
```

[13] Four pillars. All real. All reported. You can compute everything from these: yield, leverage, velocity, operating ratio. You can see the full cascade. You can understand exactly how the operator is working.

[14] Here's what my own numbers look like on Claude:

```
  Input:         36.7M     (0.24%)
  Output:        54.1M     (0.35%)
  Cache write:  803.5M     (5.18%)
  Cache read:   14.6B     (94.23%)
  Total:        15.5B
```

[15] My operating ratio is 398:1:1.5. For every token of fresh input I provide, I read 398 tokens of cached context and produce 1.5 tokens of output. That's my fingerprint. It tells you I'm compounding. I'm not pumping tokens. I'm building a context library and reading it heavily.

[16] This is the full picture. This is what every system should report. But not every system does.

## Codex: The Invisible Pillar

[17] Codex, OpenAI's coding agent, reports tokens differently. Here's what a Codex session summary looks like:

```
input_tokens:      280,931,419
output_tokens:      23,655,246
cache_write:                 0
cache_read:      5,845,750,656
```

[18] Cache write is zero. Not small. Not rounded down. Zero.

[19] This is not a bug. It's how ChatGPT and Codex report tokens. They bundle cache creation into the input field. When you send a request that includes cached context plus new input, the API returns the combined total as `input_tokens` and reports `cache_creation_input_tokens` as zero. The cache write happened. It's in there. It's just not separated out.

[20] This means that for any Codex operator, their input number is inflated. It contains both their real fresh input and their cache writes, mashed together. And their cache write shows as zero, which makes them look like they're not compounding at all.

[21] Here's what that does to the cascade math. Take kr-yeon, a real Codex operator with 23.7M output and 5.85B cache read. His reported input is 280.9M with cache write at zero. If you run the yield formula on those numbers:

```
  Yield = (cache_read x output) / input^2
  Yield = (5.85B x 23.7M) / 280.9M^2
  Yield = 0.08
```

[22] Yield of 0.08. That ranks him at #1514 on the board. Non-compounding. Bottom of the pile. The formula says: this operator is not building cache, not reusing context, not compounding. They're just dumping input.

[23] But he is compounding. He has 5.85 billion tokens of cache read. You don't get 5.85B cache reads without writing cache. The data is there. It's just hidden in the input field.

## Splitting the Signal

[24] To fix this, we need to split the combined input back into its two components: real fresh input and cache write. We can't do this perfectly without the original API response. But we can estimate it using operating ratios.

[25] An operating ratio is the relationship between cache read, input, and output for a given type of operator. We have three reference ratios:

```
  AA avg:      3.5 : 1 : 0.5    (cache_read : input : output)
  HCM:        20   : 1 : 0.1    (human center of mass)
  Codex PU:  243   : 1 : 1.03   (Codex power-user)
```

[26] The velocity term (output / input) tells us how much fresh input an operator needs to produce a given amount of output. If we know the output and the velocity, we can solve for input:

```
  input = output / velocity
  cache_write = combined_input - input
```

[27] Run kr-yeon through all three ratios:

```
                      AA avg         HCM       Codex PU
                   3.5:1:0.5     20:1:0.1   243:1:1.03
  ─────────────  ────────────  ────────────  ────────────
  Input            47,310,492   236,552,460    22,966,258
  Output           23,655,246    23,655,246    23,655,246
  Cache write     233,620,927    44,378,959   257,965,161
  Cache read    5,845,750,656 5,845,750,656 5,845,750,656
  ─────────────  ────────────  ────────────  ────────────
  Yield                 61.78         2.47       262.17
  Rank                  #242        #706         #137
```

[28] Three different yields. Three different ranks. From #706 to #137 depending on which ratio you pick. The question is: which one is right?

## The Cache Write Red Herring

[29] Here's where it gets interesting. We analyzed 1,495 operators who do report cache write (Claude users with real telemetry). We grouped them by their actual operating ratio and looked at how much cache write they produce:

```
  HCM operators (leverage 15-25x):   avg cache_write = 313.4M
  PU operators  (leverage 200-300x): avg cache_write = 269.3M
```

[30] Nearly identical. Despite having vastly different profiles (HCM operators have 40x more input, 4.3x more output), they produce almost the same amount of cache write. Cache write turns out to be relatively constant across operator profiles. It's the cost of building a context library. The library has a size.

[31] Now look at what each ratio produces for kr-yeon:

```
  AA avg:    233.6M cache write    (within real range)
  HCM:        44.4M cache write    (6x below real range)
  Codex PU:  258.0M cache write    (within real range)
```

[32] HCM produces 44.4M cache write. That's 6x below what any real operator cohort produces. It's not a real number. No group of operators at any leverage level creates that little cache write. The HCM ratio is broken for this operator.

[33] The reason is simple. HCM's velocity is 0.1, meaning input = output / 0.1 = 236.6M. That eats 84% of the combined input, leaving only 44.4M for cache write. HCM works fine on real HCM operators who have 1.5 billion tokens of input. It breaks on Codex operators whose combined input is small relative to their output.

[34] The cache write number is the red herring. It's the one derived value that can be checked against reality. And when it's wrong, it's wrong by 6x. The ratio that produces it is not valid for this operator.

[35] AA avg and Codex PU both produce cache write in the 233-258M range, consistent with real data. The choice between them is a velocity question. kr-yeon's cache read to input ratio is ~255:1, which matches the Codex PU profile (243:1) almost exactly. He's a power user. His real rank is #137, not #1514.

## The Convergence

[36] This is where the two factors converge. The token reporting discrepancy (Codex bundling cache write into input) and the operating ratio framework (using reference profiles to split the signal) meet at one point: cache write.

[37] Cache write is the derived number. It's what we solve for. Cache read is the real number. It's what validates the solution. When the derived cache write matches what real operators produce, the ratio fits. When it doesn't, the ratio is broken.

[38] The token is the atom. But the way atoms are counted determines what molecules you can see. Claude shows you the molecule: four distinct pillars, each measurable, each meaningful. Codex shows you a lump. The lump contains the molecule, but you can't see it without splitting.

[39] This is the Tokens of Babel. Different systems, different languages, different levels of completeness. The same operator can be #1514 or #137 depending on how their tokens are reported. The same behavior can look like compounding or like pumping depending on which pillars are visible.

## What This Means

[40] None of this is intentional. Codex didn't deliberately hide cache write to make operators look bad. The API returns what it returns. The summary was designed for billing, not for performance analysis. When you're building a product, you track what you need to track. You don't always anticipate that someone will want to measure operator efficiency at the token cascade level.

[41] But the gap is real, and it has consequences. Every Codex operator on a volume-based leaderboard is being ranked on inflated input. Every Codex operator on a yield-based leaderboard is being flagged as non-compounding. Their cache write is zero. Their yield is null. They sink to the bottom. Not because they're bad operators. Because the data that would show they're good operators is invisible.

[42] The operators who look the worst are often the ones working the hardest. kr-yeon has 5.85 billion tokens of cache read. He's compounding massively. But his cache write is zero, so the formula says he's not compounding at all. The formula isn't wrong. The data is incomplete.

[43] This is a sign of how young this field is. We're measuring AI operator performance with tools that were built for billing and usage tracking, not for understanding how humans work with AI. The invisible data, the cache write that's bundled into input, the leverage that's hidden, the yield that's nullified. These are not edge cases. They're the norm for an entire platform's worth of operators.

[44] The attempts to capture it, the processing, the progress. Building tools that parse the raw logs. Building formulas that split the signal. Building ratios that estimate what's missing. Each step gets closer to the truth. Each step reveals more of the cascade. And each step makes it possible to do more with less, to see the operators who are quietly winning, to surface the efficiency that volume-based metrics hide.

[45] The operators who turn modest usage into massive efficiency are out there. They're reading 250 tokens of cache for every token of input. They're producing output at 1:1 velocity. They're compounding. But you can't see them on a volume board. You can't see them on a dashboard that reports cache write as zero. You can only see them when you split the signal and look at the cascade.

[46] That's what SigRank does. It takes the tokens, whatever shape they arrive in, and reconstructs the cascade. It uses operating ratios to estimate what's missing. It validates the estimates against real data. And it surfaces the operators who were invisible.

---

## The Headlines

[47] A few ways to frame this, depending on where it lands:

> "The real AI power users aren't the biggest spenders."

> "Meet the ghost-rank operators, crushing it without burning tokens."

> "Most heavy AI users are still playing the wrong game."

> "Your token volume doesn't matter. This is what actually does."

> "The quiet operators quietly winning at AI."

> "Stop chasing volume. Start chasing yield."

> "These operators turned modest usage into massive efficiency."

> "The real elite AI operators aren't the ones posting the biggest numbers."

[48] They're all saying the same thing. The numbers that everyone is looking at, total tokens, are the wrong numbers. The numbers that matter, the cascade, are either invisible or incomplete. And the operators who are winning are the ones you can't see.

---

*Data: 1,495 operators with full telemetry, 1,628 operators total*
*Analysis: Operating ratio stress test, cache write convergence validation*
*Tool: SigRank, `npx sigrank` on npm*
*Live board: [signalaf.com](https://signalaf.com)*
*Ratio review: `npx sigrank review --output N --cache-read N --combined-input N`*

---

*This work is part of a broader research program on [Commitment Theory](https://github.com/SunrisesIllNeverSee/Commitment_Theory), a 34-paper investigation into how governance structures emerge from measurable behavior in autonomous systems. SigRank applies the same principle to AI operators: you don't measure trust by asking, you measure it by observing the cascade.*

*- djm, [MOSES](https://mos2es.com)*
*[@burnmydays on X](https://x.com/burnmydays), [GitHub](https://github.com/SunrisesIllNeverSee)*
