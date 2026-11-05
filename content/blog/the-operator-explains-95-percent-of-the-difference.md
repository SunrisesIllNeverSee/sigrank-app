---
type: article
title: "The Operator Explains 95% of the Difference. The Tool Explains 1%."
description: "We benchmark AI models constantly. SigRank asks a different question: how effectively are humans and AI systems operating together?"
seo_description: "Early SigRank pilot evidence explores how operator behavior, interventions, and workflow structure shape collaborative human-AI performance."
tags: [article, sigrank, signalaf, human-ai-performance-intelligence, ai-operators, enterprise-ai, token-telemetry, operator-performance, benchmarking, moses]
timestamp: 2026-11-05T18:10:00Z
author: Deric J. McHenry
---

On October 26, Guillermo Rauch wrote something that stopped me because it described almost exactly what I had been trying to measure.

“There’ll be times where you over-guide the AI. It knows better than you and is more intelligent than you.

There’ll be times where you under-guide the AI. It can go off-track, have the wrong biases, or miss context.

How well you manage this superpower is the #0 skill I look for.”

He named something the industry talks about constantly and still barely measures.

We benchmark models. We measure context windows, latency, reasoning scores, price per million tokens, agent success rates and application traces.

Companies measure AI seats, logins, usage and spend.

What they generally cannot answer is a much simpler question:

**How effectively are the human and the AI actually operating together?**

That is the problem I started working on with SigRank.

I did not start with the assumption that the person using the most AI must be the best operator.

In fact, that assumption fell apart almost immediately.

On the current SignalAF board, one account has consumed **79.3 billion tokens and ranks #17**.

My account has consumed **57.8 billion and ranks #3**.

More activity. More tokens. Lower rank.

That gap is the entire point.

**Volume tells you how much happened. It does not tell you whether it happened well.**

The same problem appears inside companies.

If an organization buys fifty AI seats, its administrative dashboard can usually tell management who logged in, how often the system was used and how much it cost.

It does not necessarily tell them whether those fifty people developed fifty different levels of operating capability.

And they almost certainly did.

That is where my pilot work became interesting.

In a controlled 50-seat demonstration using the production measurement engine, with the model and tools held constant, differences in operator behavior accounted for roughly **94.9% to 98.0% of the measured variation**.

Tool choice accounted for roughly **0.2% to 1.1%**.

That does not mean models do not matter.

It does not mean those percentages are a universal law.

It means something narrower and, to me, more useful:

**When much of the technical environment is held constant, the way a person operates the system can dominate the measured differences.**

The collaborative human-AI relationship itself becomes a meaningful unit of analysis.

That relationship also shows up in the telemetry.

Over-guiding creates one pattern.

Input grows because the operator keeps pushing information and instruction into a system that may already have enough context to continue.

Under-guiding creates another.

Nothing compounds. Useful context is not reused, so every session begins by rebuilding work that should already exist.

The more effective operator sits somewhere between those extremes.

Enough direction is supplied to establish intent and constraints. Then the model is allowed to build, reuse context and produce useful work.

That is the operating relationship SigRank is designed to quantify.

SigRank currently derives statistics such as **Yield, Leverage, Velocity and signal-to-noise** from token telemetry.

It looks at the relationship between what the operator contributes, what the system retains or reuses and what comes back out.

Importantly, this is not designed around how expensive a session was, how often someone logged in, which endpoint they touched or what they wrote in an email.

Prompt content does not need to leave the machine.

The objective is to quantify dimensions of **optimization, proficiency and operating performance** without turning the measurement system into another employee-surveillance product.

That distinction became even more important once I started looking at interventions.

Across twelve interventions in the pilot work, **seven improved the measured result**.

Two produced no meaningful change.

Three made the operator worse.

That may be one of the more useful findings.

Companies are rapidly rolling out AI training, prompting playbooks, model migrations and new workflow standards.

The assumption is usually that intervention equals improvement.

It does not.

Sometimes changing the way somebody works with an AI system degrades the operating relationship.

If you are about to roll a workflow change across fifty or five hundred seats, it would be useful to know that before deployment rather than afterward.

One operator in the same work accounted for **43% of a team's measured Yield**.

Meanwhile, **48 of 50 seats sat on a plateau**.

If you only looked at the team average, much of that structure would disappear.

And that leads to the result that did not work.

When I pooled the data at the aggregate level in a meta-pilot, I did **not** find a strong or moderate correlation.

That matters, and I do not want to hide it.

My current interpretation is that aggregation can wash out the very thing I am trying to measure.

If one operator is carrying a large portion of the useful operating signal while dozens of others are relatively flat, averaging the group can make the system look more uniform than it actually is.

That is an interpretation.

**It is not yet a proven law.**

It needs more testing.

The same is true of the interventions. Seven improved. Three degraded.

Changing how somebody operates AI does not automatically make them better at it.

Measurement should tell you that before a workflow change is rolled across an entire organization.

The current field is still early.

There are roughly **50 real enrolled operators**, about **22 currently submitting telemetry**, and hundreds of billions of tokens represented on the board.

There are additional field-research records and a separate seeded test population used to stress scoring and leaderboard behavior.

The seeded profiles are not users.

That distinction matters.

A benchmark becomes useless very quickly if the benchmark itself becomes marketing theater.

It is also why I care about gaming resistance.

A leaderboard people can farm is worse than no leaderboard at all.

SignalAF uses rankings, comparisons, profiles, archetypes, progression and history because people genuinely want to know how they compare.

They want to improve.

They want to see whether their operating style changes over time.

That participation helps create something conventional enterprise software rarely has:

**a cross-platform reference field for collaborative human-AI performance.**

The leaderboard is not the thesis.

**The measurement is.**

For an enterprise, the more useful question is not:

“Who is number one?”

It is:

Where is AI capability concentrated?

Where are workflows creating friction?

Which operating patterns are working?

Are people rebuilding context instead of reusing it?

Did training change anything?

Did switching models improve the system?

Did an intervention help or hurt?

Is the organization paying for fifty AI seats while meaningful proficiency exists in only five of them?

Those are questions about the **collaborative human-AI operating system**.

They are not judgments about an employee's worth.

That boundary matters to me.

I do not want SigRank turned into an automated hiring, firing, compensation or disciplinary score.

The cleanest way I have found to describe what we are measuring is:

> **We measure the collaborative human-AI operating system, creating a benchmark for Enterprise Intelligence, not the employee.**

That also explains where I think this fits as a market.

Companies such as LangSmith, Braintrust, Arize, Langfuse and Weights & Biases help enterprises understand models, applications and agents.

Workforce analytics platforms help companies understand people, adoption and organizational behavior.

There is another layer between those worlds:

**how effectively humans and AI systems operate together.**

I think that layer will become its own category.

I call it **Human-AI Performance Intelligence**.

SigRank provides the measurement layer.

SignalAF creates the external reference field.

MO§ES Enterprise takes the same underlying measurement system into an organization, establishes a baseline, identifies operating differences, tests interventions and then measures what changed.

Where appropriate business data is available, those operating changes can also be evaluated against cost, quality, throughput, delivery or another customer outcome.

There is a larger research problem behind all of this as well.

Language moving between people, models, agents and tools carries more than words.

It carries intent.

Constraints.

Permissions.

Obligations.

Context.

Commitments.

As those instructions are transformed and passed through increasingly complex AI systems, some of that structure survives and some of it drifts.

My broader work through **MO§ES™ and Commitment Theory** asks whether those transformations can be formally measured and whether important commitments can be preserved through them.

That research requires a much higher evidentiary standard than a leaderboard or commercial product.

It needs formal specification, benchmarking, falsification, independent validation and academic scrutiny.

SigRank is the measurement system I can test commercially now.

The larger MO§ES thesis is what I am trying to determine can exist beyond it.

And Rauch's observation is what connects the two.

Managing AI well is not simply a prompting trick.

It is an operating capability.

As AI systems become more capable, the quality of that operating relationship may matter **more**, not less.

Models already have benchmarks.

**What we are only beginning to build are benchmarks for the systems humans form with them.**
