---
type: article
title: "The Three Modes Behind the AI Operator Board"
description: "Equal token totals can hide radically different workflows. Read human-led, hybrid/HITL, and agentic operation through four token pillars, operating ratio, throughput, and submission history."
tags: [article, sigrank, ai-operators, operating-ratio, token-telemetry, hitl, agentic, cascade, methodology]
timestamp: 2026-10-05T10:00:00Z
author: SignalAF
---

Ten million tokens. Three workflows. Three very different ways of working with AI.

One person is steering a conversation turn by turn. Another sets a task, lets the system work through a batch, then reviews and redirects it. A third sets up a workflow that executes a queue of tasks with little ongoing intervention. A token-total leaderboard can put all three beside the same number. SigRank gives you the next question: **what happened to those tokens?**

That is where the board becomes interesting. Fresh input, generated output, context construction, and context reuse form an operating signature. Add a measured period and you can see the rate at which that signature runs. Add workflow evidence and you can connect the numbers to a way of working.

The field is about AI operators: people, builders, and systems organizing AI work. It gives their approaches a common statistical language. Like the stats of a sport or game, each measure makes a different part of the action visible—and gives you something specific to explore, compare, and learn from.

## Same total, different game

The following **illustrative examples** each contain exactly ten million processed tokens over ten calendar days. Their workflow descriptions are assumptions for the example, rather than classifications of real board members.

| Recorded token flow | Human-led session | Hybrid/HITL workflow | Agentic workflow |
|---|---:|---:|---:|
| Fresh input, I | 2,000,000 | 100,000 | 10,000 |
| Generated output, O | 200,000 | 1,000,000 | 2,000,000 |
| Cache writes, W | 800,000 | 900,000 | 990,000 |
| Cache reads, R | 7,000,000 | 8,000,000 | 7,000,000 |
| Total processed | 10,000,000 | 10,000,000 | 10,000,000 |
| Operating ratio, R/I : 1 : O/I | 3.5:1:0.10 | 80:1:10 | 700:1:200 |
| Yield, Υ | 0.35 | 800 | 140,000 |
| Processed tokens per day | 1,000,000 | 1,000,000 | 1,000,000 |
| Output tokens per day | 20,000 | 100,000 | 200,000 |

The totals tie. The operating ratios tell three distinct stories.

In the first example, fresh input is a substantial part of the activity: the person keeps supplying direction and context. In the second, a smaller amount of fresh input supports considerably more reuse and output. In the third, a very small fresh-input denominator accompanies large amounts of output and returning context. The described execution process explains why we call that example agentic.

That final ratio is striking. It also rewards a closer look: how much fresh input was recorded, what the harness counted, how long the run lasted, and how it was directed. A higher Yield is a stronger measured reuse/output relationship to fresh input. Assessing the resulting work—its correctness, usefulness, or originality—adds a different kind of evidence.

## Four pillars make the signature readable

Every measured cascade begins with four counts:

- **I — fresh input:** newly supplied input tokens, after the source adapter separates cached input according to its counting rules. This can include tool or system material as well as human-written instructions.
- **O — generated output:** tokens produced by the model.
- **W — cache writes:** context written or committed for reuse.
- **R — cache reads:** context read again during subsequent processing.

Their sum describes recorded token traffic. Cache reads count each time context is processed again. A billion cache-read tokens can therefore represent a smaller body of context revisited many times. The combination of reuse and newly built context is what makes the flow worth examining.

Raw telemetry gives you the foundation. Derived metrics give you different views of that foundation. A useful profile makes both available, so an impressive score can lead to an understandable pattern.

## Three ways a workflow can run

**Human-led work** involves substantial direct steering during execution. The operator supplies instructions, evaluates responses, changes direction, and chooses the next action. A person can carry out this style at considerable scale while using tools, cached context, and sophisticated prompts.

**Hybrid or human-in-the-loop work** gives the system meaningful stretches of execution between human checkpoints. The operator may set up a plan, review a batch of changes, resolve a decision, and send the workflow forward again. The interesting question is where that person intervenes and what those interventions accomplish.

**Agentic work** performs sustained sequences of actions with limited ongoing intervention. A human may define the goal, establish constraints, build the harness, and inspect the result while the workflow executes its own intermediate steps.

The same operator can use all three. Designing a workflow, supervising a run, and steering each turn are different activities. An operator's history can show those activities changing from one submission to the next.

Token signatures help you find these differences. High output relative to fresh input, deep context reuse, and sustained throughput can make an agentic interpretation worth investigating. The execution record establishes how the workflow actually ran. Fresh input includes more than human typing, and an aggregate ratio does not count the number of human interventions.

For the board release accompanying this work, the planned controls are **HITL / Agentic / All**: HITL uses the defined Human Center of Mass composition rule; Agentic uses an explicit assessment linked to a scored submission and workflow evidence; All combines the eligible rows. The three execution styles above provide a richer reading of the work. They are not three additional board filters, and the historical HCM screen is a composition rule rather than an intervention log.

## The operating ratio is the quick read

**R/I : 1 : O/I** reads as: for each unit of fresh input, how much context returned, and how much output was generated?

An operating ratio of **80:1:10** means 80 cache-read tokens and ten output tokens per fresh-input token. It makes the balance memorable. Cache writing adds the context-building dimension alongside that ratio.

| Metric | Calculation | What it brings into focus |
|---|---|---|
| Leverage | R / I | Context reuse per fresh-input token |
| Velocity | O / I | Generated output per fresh-input token |
| Yield, Υ | (R × O) / I² = Leverage × Velocity | The combined reuse/output relationship |
| SNR | O / (I + O) | Output's share of the fresh-input/output exchange |
| Construction | W / R | Cache writing relative to cache reading |
| 10xDEV | log₁₀(Leverage), under the metric's required pillar conditions | Reuse expressed on a logarithmic scale |

In the hybrid worked example, Leverage is 80 and Velocity is ten, giving Yield 800. SNR is approximately 0.909, and Construction is 11.25%. That high SNR belongs to the checkpoint-driven workflow we described. The numbers become more useful when you read them beside the execution process.

Construction deserves particular attention. Two runs can have the same operating ratio while writing very different amounts of cache. One may repeatedly draw on an established context; another may build substantial new reusable context as it works. Neither the rank nor the three-part ratio captures that difference by itself.

For these examples, fresh input and cache reads are positive. Real measurements must preserve each metric's domain and missing-field rules. A missing pillar is different from a recorded zero; an undefined calculation needs an explicit unavailable value.

## Add time, and scale becomes easier to interpret

Throughput asks how much recorded activity passes through the workflow over its measured period:

**Processed tokens per calendar day = (I + O + W + R) / actual elapsed days.**

**Output tokens per calendar day = O / the same actual elapsed days.**

The three examples process the same million tokens per day, but generate different output rates. Their composition and activity rate belong together.

Now multiply every pillar in one example by 100 while keeping the same ten-day period. Its operating ratio, Yield, SNR, and Construction stay the same. Its processed and output rates rise 100-fold. You have the same shape operating at a very different scale. That is a distinction a ratio alone cannot show.

Use the snapshot's actual start and end timestamps for the denominator. A label such as “30-day” is a selection window, not a substitute for retained coverage bounds. An all-time daily rate also needs an actual recorded period. If an active-day intensity measure is available, label it separately from the calendar-day rate.

## A snapshot turns a score into something you can follow

A useful submission snapshot connects the platform, actual period, four recorded counts, derived metrics, calculation version, and any documented workflow mode. A public work sample can add the next link: what was made during that run.

Follow the hybrid example through that chain: ten days of recorded operation; 100,000 fresh-input tokens; one million output tokens; 900,000 cache writes; eight million cache reads. Those counts produce **80:1:10**, Yield **800**, and **100,000 output tokens per calendar day**. Its workflow description places human review between autonomous batches. A linked work sample would let you inspect what those batches produced.

On a real profile, repeated snapshots make new comparisons possible. Did the operator build more context this time? Did the reuse pattern persist? Did output rate rise because the workflow changed, because it ran longer, or because more work was queued? Dates and period bounds make those questions answerable.

The public statistics can support that exploration while prompts, transcripts, credentials, device identifiers, and private logs remain outside the public history. Work samples are a separate, deliberately shared source.

## Read the field from more than one angle

The homepage's **Four Degrees** offers four reference points: a modeled baseline, the screened field's center, a top-100 median, and a leading evaluation. Those columns represent different reference groups. Read their cohort labels and dates with the numbers. A modeled baseline is a reference construction; a field median summarizes a particular population.

The [historical field analysis](/blog/volume-isnt-yield) supplies another view: how a broad dataset divides into token-flow patterns. The [active board](/board/all) lets you explore current eligible operator records. Each helps you ask a different question.

Build Archetypes make recurring measured shapes easier to recognize. Workflow mode explains execution. Class records scale or qualification under its rules, and rank locates a profile within the selected field. Together, they provide several ways to discover an interesting operator beyond the first row.

Try comparing similar totals with different operating ratios. Then try similar ratios at different throughput. Look for unusually strong context construction. Follow one operator across submissions. The board has more than one kind of standout, and these views give you the language to explain why.

That is the educational value of an operator leaderboard: common reference points, visible differences, and concrete approaches worth investigating. **Tokenpull measures → SigRank evaluates → SignalAF publishes.** Start with the counts, read the relationships, and follow the workflow behind them.

## Sources and further reading

- [SigRank methodology](/methodology) — measurement scope, interpretations, and limitations.
- [TTEOP](/standard) — the public telemetry protocol and metric contracts.
- [Volume Isn't Yield](/blog/volume-isnt-yield) — the dated field analysis and terminology correction.
- [Field analysis and Build Archetypes](/field) — reference populations and measured shapes.
- [SignalAF board](/board/all) — operator exploration; rankings and values change with the selected scope.

The worked counts and workflow descriptions in this article are illustrative. They are not observations of named operators or live leaderboard placements.
