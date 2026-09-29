<!--
  ARCHIVED — UNDEPLOYED ARTICLE DRAFT (two versions: markdown + HTML)
  ==================================
  Source: Rewrite of the original 2025-08-14 Medium article
    "12 Million Tokens and 28 Days Later: The First User-Based AI Leaderboard Is Born"
    Original: https://medium.com/@burnmydays/12-million-tokens-later-the-first-user-based-ai-leaderboard-is-born-c7d23df29936
    Original source file: _7_labs/assets/articles/medium/12-million-tokens-later.md
  Date: ~2026-08/09 (rewrite, date uncertain)
  Status: Never deployed. Not in sigrank-app/app/blog/. Not on signalaf.com.
         Not in any repo as a file. The original Medium article IS published.

  CANON CONCERNS — DO NOT DEPLOY AS-IS:
    This rewrite uses deprecated/historical terminology that conflicts with
    the current Search Authority canon:

    1. SignaRate™ — marked HISTORICAL/SUPERSEDED in canon. The public app
       still references SIGNA RATE but the search-authority registry has it
       as historical. The current headline metric is Yield (Υ), which this
       article does NOT mention.

    2. SDOT (Signal Delta Over Time) — marked HISTORICAL in canon. Retired
       then un-retired 2026-05-21. The article uses it as current terminology.

    3. "Interaction signature" — not a canon term. The canon uses "operator"
       and "telemetry-derived metrics" (Yield, Leverage, Velocity, SNR).

    4. Ghost Tokens, Cheese Tax, sigdrunk — colorful terms from the original
       2025 Medium article. Not part of the current canon. May be usable as
       voice/tone but should not be presented as canonical metrics.

    5. The article frames SigRank as ranking "human-AI interaction patterns"
       rather than the canon definition: ranking AI OPERATORS by
       telemetry-derived metrics (Yield).

  POSITIONING:
    On-position in spirit (user/operator side, not model side). The core
    thesis — "the user is part of the system, not a passive input field" —
    aligns with SigRank's operator-vs-model distinction. But the terminology
    and framing need significant rewriting to be canon-compliant.

  WOULD NEED BEFORE PUBLISHING:
    - Replace SignaRate/SDOT with Yield (Υ) and current metric names
    - Replace "interaction signature" with "operator telemetry" or similar
    - Add Yield (Υ) formula: (cache_read × output) / input²
    - Ground Ghost Tokens/Cheese Tax/sigdrunk as voice, not canon metrics
    - Align "user-based AI leaderboard" framing with "operator leaderboard"

  Archived: 2026-09-08
  Archived by: Devin session
-->

# Version 1: Markdown

# 12 Million Tokens and 28 Days Later: The First User-Based AI Leaderboard Is Born

Twelve million tokens and 28 days later, a simple question has turned into a working idea: what if AI performance could be measured from the user side, not just the model side? The result is a user-based AI leaderboard and universal metric for measuring a person's interaction signature across AI systems (SigRank/SignaRate, SDOT)—a way to look at how people actually work with AI, not just how models behave in sterile benchmark labs. It is part measurement system, part mirror, and part warning label for anyone who has ever emerged from a prompt session mildly sigdrunk.

## What is a user-based AI leaderboard?

A user-based AI leaderboard ranks human-AI interaction patterns instead of ranking only AI models. Traditional leaderboards ask, "Which model performs best on this task?" A user-based leaderboard asks a different question: "What does this person's interaction signature look like across AI systems, and how consistently can that signature be measured?"

That shift matters because AI output is not created by the model alone. It is shaped by prompts, follow-ups, corrections, tone, task design, patience, domain knowledge, and, yes, the occasional Cheese Tax paid when the conversation wanders off to something shiny. Two people can use the same model and get very different results—not because one model changed, but because the interaction did.

SigRank™ and SignaRate™ are ways of naming and measuring that pattern. SDOT gives the system a practical backbone: a way to track signals across sessions, models, and use cases without pretending that a person's AI behavior is a single flat number. The goal is not to crown a "best prompter" and hand them a tiny digital sash. The goal is to make interaction quality visible.

## The model is only half the story

AI evaluation has spent a lot of time staring at models. That makes sense. Models are expensive, impressive, unstable in interesting ways, and very good at producing leaderboard drama. But once real users enter the room, the tidy benchmark picture starts to wobble.

A model can be excellent at reasoning and still produce mediocre work if the user frames the task poorly. A smaller or older system can produce useful results when guided by someone who knows how to structure context, constrain output, and call nonsense by its government name. The user is not a passive input field. The user is part of the system.

That is where interaction signatures become useful. They describe how a person tends to engage with AI across systems. Do they clarify goals early? Do they iterate effectively? Do they over-explain, under-specify, derail, compress, challenge, refine, or simply keep feeding the machine vibes and hoping for a spreadsheet? All of that leaves a pattern.

This is not about judging personality. It is about understanding interaction behavior in a practical way. If AI is becoming a daily work layer, then the way people collaborate with it deserves measurement that is more nuanced than "this prompt was good" or "the model hallucinated again, obviously."

## From tokens to signals

Twelve million tokens sounds dramatic because it is dramatic enough to be annoying at dinner. But the interesting part is not the token count by itself. Tokens are raw material. The useful work begins when those tokens are examined for repeatable signals.

Over 28 days, repeated interactions can start to reveal patterns: how a user opens tasks, how often they correct the model, what kinds of corrections work, where sessions lose focus, and where productive momentum appears. A single prompt can be lucky. A month of interaction is harder to fake.

That is the practical difference between a prompt showcase and a user-based leaderboard. A showcase celebrates one shiny output. A leaderboard built around interaction signatures asks whether the behavior holds across tools, contexts, and time. It is less glamorous, which is usually a sign that it may be closer to reality.

### Useful signals may include:

- **Task framing:** how clearly the user defines the goal, audience, constraints, and success criteria.
- **Context discipline:** whether the user supplies enough background without burying the model under a haystack.
- **Iteration quality:** how well the user responds to partial output, errors, ambiguity, or unexpected direction.
- **Cross-system consistency:** whether the user's interaction pattern remains recognizable across different AI systems.
- **Recovery behavior:** what happens when the model gets weird, bland, overconfident, or aggressively beige.
- **Token efficiency:** whether more input actually improves the outcome, or merely feeds the Ghost Tokens.

Ghost Tokens are the words, context, and conversational debris that feel useful in the moment but do not meaningfully improve the result. They are not always obvious. Sometimes they wear a nice blazer and call themselves "additional context."

## Why SigRank™ and SignaRate™ need each other

SigRank™ and SignaRate™ are useful because they describe related but distinct parts of the same idea. SigRank™ suggests comparative position: where a user's interaction signature sits relative to others or relative to a defined benchmark. SignaRate™ suggests rate, score, or measurement: how the signature performs or changes over time.

Used together, they avoid a common measurement trap. A rank without context can become vanity math. A rate without comparison can become a private dashboard of mysterious numbers. Together, they can help show both where a user stands and how their interaction behavior develops.

That said, this kind of metric should be handled carefully. A person's AI interaction style is not the same as intelligence, creativity, or professional worth. A useful system should measure observable behavior, not turn humans into trading cards.

The better use case is improvement. If SignaRate™ shows that a user tends to spend too many tokens clarifying after the model has already gone sideways, that user can learn to front-load constraints. If SigRank™ shows strong cross-system consistency, that may suggest the user has developed transferable AI collaboration habits. Neither result needs confetti. Both can be useful.

## What does SDOT actually do?

SDOT can be understood as the organizing layer that connects interaction data to a usable metric. In plain terms, it helps translate messy AI conversations into structured signals that can support a leaderboard, a score, or a pattern analysis. Without something like SDOT, the whole thing risks becoming a pile of chats and good intentions.

The challenge is that AI interaction is messy by nature. People change tasks midstream. Models respond differently. A user may test the same idea in multiple systems, rewrite the prompt, abandon the session, return later, and then blame the tool for not remembering the thing they never said. We have all been there. Some of us have purchased property there.

SDOT gives the concept a framework for making those interactions comparable. It does not need to flatten every conversation into sameness. Instead, it can help identify what should be compared: patterns, behaviors, outcomes, recovery loops, and signal strength across systems.

For new readers, this is the heart of the concept. The user-based AI leaderboard is not just a scoreboard. It is an attempt to create a shared measurement language for how people interact with AI.

## The Cheese Tax is real

Every AI workflow has a Cheese Tax. It is the extra cost paid when the user adds unnecessary context, chases a tangent, asks for one more variation, or lets the model produce a majestic paragraph that nobody needed. Sometimes the Cheese Tax is harmless. Sometimes it eats the afternoon.

In a user-based measurement system, the Cheese Tax matters because it affects efficiency and output quality. A user who spends 4,000 tokens to get a 400-word answer may be doing deep, valuable exploration. Or they may be circling the airport because they never stated the destination. The metric has to know the difference.

That is why interaction signatures should consider behavior over time rather than isolated sessions. One long messy conversation might be necessary. Twenty long messy conversations with the same avoidable detour may indicate a pattern.

### A practical checklist for better interaction hygiene

- **State the desired output early.** Tell the system what you want before handing it your entire attic.
- **Define constraints clearly.** Length, tone, format, audience, exclusions, and purpose all matter.
- **Correct with specifics.** "Make it better" is a wish. "Make it more concise and less promotional" is direction.
- **Watch for Ghost Tokens.** Extra context should earn its keep.
- **Stop before you are sigdrunk.** If the session starts making perfect sense and no sense at the same time, step away.

## Why this matters beyond bragging rights

The obvious temptation is to treat a leaderboard as a competition. That is understandable. Humans can turn anything into a ranking system, including sandwiches, airports, and methods of suffering through meetings. But the more interesting value is practical.

For individuals, a user-based leaderboard can reveal how their AI habits affect outcomes. It can show whether they are improving, where they lose efficiency, and which interaction patterns transfer across systems. That is useful for writers, analysts, developers, researchers, operators, educators, and anyone else trying to get consistent value from AI without needing a ritual candle.

For teams, the value may be even clearer. If a company wants to improve AI adoption, it needs more than tool access. It needs to understand how people are using those tools. A universal metric for measuring interaction signatures can help identify training needs, workflow friction, and repeatable best practices without reducing the conversation to "use better prompts."

For AI builders, user-side measurement can expose where systems support collaboration well and where they create confusion. If many strong users hit the same failure point, that may say something about the tool, not the humans. Measurement becomes more useful when it can hold both sides of the interaction accountable.

## The risks are worth naming

Any metric can be misused. A user-based AI leaderboard is no exception. If implemented carelessly, it could reward performative prompting, penalize unusual but effective workflows, or encourage people to optimize for the score instead of the work.

That is why the framing matters. SigRank™ and SignaRate™ should be treated as indicators, not identities. SDOT should support interpretation, not pretend that messy human collaboration can be fully captured by a single number. The goal is clarity, not surveillance with better branding.

Good measurement should make people more capable. Bad measurement makes people more anxious and less honest. If this field is going to mature, it needs both ambition and brakes.

## The first leaderboard is a starting line

The first user-based AI leaderboard is not the end of the conversation. It is the beginning of a more useful one. After 12 million tokens and 28 days, the important discovery is not simply that users can be ranked. It is that user behavior can be studied, compared, and improved across AI systems in a structured way.

That opens the door to better training, better tools, and better habits. It also gives us a vocabulary for the weird middle space where human intention meets machine response and both sides pretend the other one started it.

SigRank™, SignaRate™, SDOT, Ghost Tokens, Cheese Tax, and sigdrunk may sound playful—and they are—but they point to a serious need. If AI is becoming part of how work gets done, then interaction quality deserves its own measurement layer.

The model matters. The user matters. The space between them is where the real work happens. And now, finally, that space has a leaderboard.

---

# Version 2: HTML

<h1>12 Million Tokens and 28 Days Later: The First User-Based AI Leaderboard Is Born</h1><p>Twelve million tokens and 28 days later, a simple question has turned into a working idea: what if AI performance could be measured from the user side, not just the model side? The result is a user-based AI leaderboard and universal metric for measuring a person's interaction signature across AI systems (SigRank/SignaRate, SDOT)—a way to look at how people actually work with AI, not just how models behave in sterile benchmark labs. It is part measurement system, part mirror, and part warning label for anyone who has ever emerged from a prompt session mildly sigdrunk.</p><h2>What is a user-based AI leaderboard?</h2><p>A user-based AI leaderboard ranks human-AI interaction patterns instead of ranking only AI models. Traditional leaderboards ask, "Which model performs best on this task?" A user-based leaderboard asks a different question: "What does this person's interaction signature look like across AI systems, and how consistently can that signature be measured?"</p><p>That shift matters because AI output is not created by the model alone. It is shaped by prompts, follow-ups, corrections, tone, task design, patience, domain knowledge, and, yes, the occasional Cheese Tax paid when the conversation wanders off to something shiny. Two people can use the same model and get very different results—not because one model changed, but because the interaction did.</p><p>SigRank™ and SignaRate™ are ways of naming and measuring that pattern. SDOT gives the system a practical backbone: a way to track signals across sessions, models, and use cases without pretending that a person's AI behavior is a single flat number. The goal is not to crown a "best prompter" and hand them a tiny digital sash. The goal is to make interaction quality visible.</p><h2>The model is only half the story</h2><p>AI evaluation has spent a lot of time staring at models. That makes sense. Models are expensive, impressive, unstable in interesting ways, and very good at producing leaderboard drama. But once real users enter the room, the tidy benchmark picture starts to wobble.</p><p>A model can be excellent at reasoning and still produce mediocre work if the user frames the task poorly. A smaller or older system can produce useful results when guided by someone who knows how to structure context, constrain output, and call nonsense by its government name. The user is not a passive input field. The user is part of the system.</p><p>That is where interaction signatures become useful. They describe how a person tends to engage with AI across systems. Do they clarify goals early? Do they iterate effectively? Do they over-explain, under-specify, derail, compress, challenge, refine, or simply keep feeding the machine vibes and hoping for a spreadsheet? All of that leaves a pattern.</p><p>This is not about judging personality. It is about understanding interaction behavior in a practical way. If AI is becoming a daily work layer, then the way people collaborate with it deserves measurement that is more nuanced than "this prompt was good" or "the model hallucinated again, obviously."</p><h2>From tokens to signals</h2><p>Twelve million tokens sounds dramatic because it is dramatic enough to be annoying at dinner. But the interesting part is not the token count by itself. Tokens are raw material. The useful work begins when those tokens are examined for repeatable signals.</p><p>Over 28 days, repeated interactions can start to reveal patterns: how a user opens tasks, how often they correct the model, what kinds of corrections work, where sessions lose focus, and where productive momentum appears. A single prompt can be lucky. A month of interaction is harder to fake.</p><p>That is the practical difference between a prompt showcase and a user-based leaderboard. A showcase celebrates one shiny output. A leaderboard built around interaction signatures asks whether the behavior holds across tools, contexts, and time. It is less glamorous, which is usually a sign that it may be closer to reality.</p><h3>Useful signals may include:</h3><ul><li><p><strong>Task framing:</strong> how clearly the user defines the goal, audience, constraints, and success criteria.</p></li><li><p><strong>Context discipline:</strong> whether the user supplies enough background without burying the model under a haystack.</p></li><li><p><strong>Iteration quality:</strong> how well the user responds to partial output, errors, ambiguity, or unexpected direction.</p></li><li><p><strong>Cross-system consistency:</strong> whether the user's interaction pattern remains recognizable across different AI systems.</p></li><li><p><strong>Recovery behavior:</strong> what happens when the model gets weird, bland, overconfident, or aggressively beige.</p></li><li><p><strong>Token efficiency:</strong> whether more input actually improves the outcome, or merely feeds the Ghost Tokens.</p></li></ul><p>Ghost Tokens are the words, context, and conversational debris that feel useful in the moment but do not meaningfully improve the result. They are not always obvious. Sometimes they wear a nice blazer and call themselves "additional context."</p><h2>Why SigRank™ and SignaRate™ need each other</h2><p>SigRank™ and SignaRate™ are useful because they describe related but distinct parts of the same idea. SigRank™ suggests comparative position: where a user's interaction signature sits relative to others or relative to a defined benchmark. SignaRate™ suggests rate, score, or measurement: how the signature performs or changes over time.</p><p>Used together, they avoid a common measurement trap. A rank without context can become vanity math. A rate without comparison can become a private dashboard of mysterious numbers. Together, they can help show both where a user stands and how their interaction behavior develops.</p><p>That said, this kind of metric should be handled carefully. A person's AI interaction style is not the same as intelligence, creativity, or professional worth. A useful system should measure observable behavior, not turn humans into trading cards.</p><p>The better use case is improvement. If SignaRate™ shows that a user tends to spend too many tokens clarifying after the model has already gone sideways, that user can learn to front-load constraints. If SigRank™ shows strong cross-system consistency, that may suggest the user has developed transferable AI collaboration habits. Neither result needs confetti. Both can be useful.</p><h2>What does SDOT actually do?</h2><p>SDOT can be understood as the organizing layer that connects interaction data to a usable metric. In plain terms, it helps translate messy AI conversations into structured signals that can support a leaderboard, a score, or a pattern analysis. Without something like SDOT, the whole thing risks becoming a pile of chats and good intentions.</p><p>The challenge is that AI interaction is messy by nature. People change tasks midstream. Models respond differently. A user may test the same idea in multiple systems, rewrite the prompt, abandon the session, return later, and then blame the tool for not remembering the thing they never said. We have all been there. Some of us have purchased property there.</p><p>SDOT gives the concept a framework for making those interactions comparable. It does not need to flatten every conversation into sameness. Instead, it can help identify what should be compared: patterns, behaviors, outcomes, recovery loops, and signal strength across systems.</p><p>For new readers, this is the heart of the concept. The user-based AI leaderboard is not just a scoreboard. It is an attempt to create a shared measurement language for how people interact with AI.</p><h2>The Cheese Tax is real</h2><p>Every AI workflow has a Cheese Tax. It is the extra cost paid when the user adds unnecessary context, chases a tangent, asks for one more variation, or lets the model produce a majestic paragraph that nobody needed. Sometimes the Cheese Tax is harmless. Sometimes it eats the afternoon.</p><p>In a user-based measurement system, the Cheese Tax matters because it affects efficiency and output quality. A user who spends 4,000 tokens to get a 400-word answer may be doing deep, valuable exploration. Or they may be circling the airport because they never stated the destination. The metric has to know the difference.</p><p>That is why interaction signatures should consider behavior over time rather than isolated sessions. One long messy conversation might be necessary. Twenty long messy conversations with the same avoidable detour may indicate a pattern.</p><h3>A practical checklist for better interaction hygiene</h3><ul><li><p><strong>State the desired output early.</strong> Tell the system what you want before handing it your entire attic.</p></li><li><p><strong>Define constraints clearly.</strong> Length, tone, format, audience, exclusions, and purpose all matter.</p></li><li><p><strong>Correct with specifics.</strong> "Make it better" is a wish. "Make it more concise and less promotional" is direction.</p></li><li><p><strong>Watch for Ghost Tokens.</strong> Extra context should earn its keep.</p></li><li><p><strong>Stop before you are sigdrunk.</strong> If the session starts making perfect sense and no sense at the same time, step away.</p></li></ul><h2>Why this matters beyond bragging rights</h2><p>The obvious temptation is to treat a leaderboard as a competition. That is understandable. Humans can turn anything into a ranking system, including sandwiches, airports, and methods of suffering through meetings. But the more interesting value is practical.</p><p>For individuals, a user-based leaderboard can reveal how their AI habits affect outcomes. It can show whether they are improving, where they lose efficiency, and which interaction patterns transfer across systems. That is useful for writers, analysts, developers, researchers, operators, educators, and anyone else trying to get consistent value from AI without needing a ritual candle.</p><p>For teams, the value may be even clearer. If a company wants to improve AI adoption, it needs more than tool access. It needs to understand how people are using those tools. A universal metric for measuring interaction signatures can help identify training needs, workflow friction, and repeatable best practices without reducing the conversation to "use better prompts."</p><p>For AI builders, user-side measurement can expose where systems support collaboration well and where they create confusion. If many strong users hit the same failure point, that may say something about the tool, not the humans. Measurement becomes more useful when it can hold both sides of the interaction accountable.</p><h2>The risks are worth naming</h2><p>Any metric can be misused. A user-based AI leaderboard is no exception. If implemented carelessly, it could reward performative prompting, penalize unusual but effective workflows, or encourage people to optimize for the score instead of the work.</p><p>That is why the framing matters. SigRank™ and SignaRate™ should be treated as indicators, not identities. SDOT should support interpretation, not pretend that messy human collaboration can be fully captured by a single number. The goal is clarity, not surveillance with better branding.</p><p>Good measurement should make people more capable. Bad measurement makes people more anxious and less honest. If this field is going to mature, it needs both ambition and brakes.</p><h2>The first leaderboard is a starting line</h2><p>The first user-based AI leaderboard is not the end of the conversation. It is the beginning of a more useful one. After 12 million tokens and 28 days, the important discovery is not simply that users can be ranked. It is that user behavior can be studied, compared, and improved across AI systems in a structured way.</p><p>That opens the door to better training, better tools, and better habits. It also gives us a vocabulary for the weird middle space where human intention meets machine response and both sides pretend the other one started it.</p><p>SigRank™, SignaRate™, SDOT, Ghost Tokens, Cheese Tax, and sigdrunk may sound playful—and they are—but they point to a serious need. If AI is becoming part of how work gets done, then interaction quality deserves its own measurement layer.</p><p>The model matters. The user matters. The space between them is where the real work happens. And now, finally, that space has a leaderboard.</p>
