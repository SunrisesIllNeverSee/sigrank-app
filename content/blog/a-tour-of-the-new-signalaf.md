---
title: "A Tour of the New SignalAF"
description: "signalaf.com has been rebuilt around one workspace: a live leaderboard with site-wide search, operator profiles with every earned badge, head-to-head comparisons, and four themes with five icon sets."
seo_description: "A tour of the rebuilt signalaf.com: the live AI operator leaderboard, operator profiles, head-to-head compare, and four themes with five icon sets."
tags: [sigrank, signalaf, product, leaderboard, redesign, guide]
timestamp: 2026-10-21T12:00:00Z
modified: 2026-10-21
author: Deric J. McHenry
hero: /blog/new-signalaf-tour/leaderboard.webp
og_image: /blog/new-signalaf-tour/og.png
---

signalaf.com has been rebuilt. Every page now lives in one workspace: a rail of sections on the left edge, a sidebar on each side, and the page in the middle. This post walks through the four pieces that changed the most.

SigRank evaluates AI operators, not AI models. It reads four token counts (input, output, cache write and cache read) and never your prompts, code or transcripts. Everything below is built on those four numbers.

## 1. The live leaderboard

The board is the home of the site. Across the top, pick a workflow (HITL, Hybrid or Auto / Review), a time window, a platform and a class, then switch between derived metrics and the raw token pillars. Column headers sort. Rank and operator stay frozen as you scroll sideways, and everything else slides past, trend sparklines included.

**Search is now in the title bar.** It finds any operator and any page on the site, from wiki entries to articles and blog posts. It stays put whether the sidebars are open or closed. The small filter box next to the class menu still filters the table itself.

![Title-bar search showing matching operators and pages](/blog/new-signalaf-tour/search.webp)

**Select a row and the inspector follows.** The right sidebar shows that operator's rank, class and build, with Profile and Watch one click away. Open **Radar · Signal history** for the full picture: a dual-signature radar of raw pillars and cascade metrics, and how the operator's combined signal has moved over time.

![Operator detail popup with the dual-signature radar and combined signal over time](/blog/new-signalaf-tour/operator-detail.webp)

The left sidebar keeps the field moving. **Top Movers** shows who climbed or fell in the window, and **Wire / Notes** rotates through what just happened: new submissions, new operators, the current leader, records, new badges and the newest writing. Both open into a popup with the full list. Every sidebar can be hidden with the **HIDE** tab on its edge and brought back from the same side.

## 2. Your operator profile

![An operator profile in the purple theme: identity card, telemetry and rank contexts](/blog/new-signalaf-tour/profile.webp)

Each operator gets a profile at `/user/<codename>`. The overview leads with an identity card: Yield, class, build and the headline cascade metrics in one place. Beside it sits the telemetry table, with each raw pillar and metric next to its field context. Rank contexts show where the operator stands in the combined field and within their own workflow.

The tabs go deeper: **Stats**, **Analysis**, **Submissions**, **Social** and **Badges**.

![The badges tab: earned pixel badges, platform milestones, records and medals](/blog/new-signalaf-tour/badges.webp)

Badges collect everything an operator has earned: pixel badges for token milestones on each platform, Hall of Signal records and medals, and class standing. The badge index and achievement index show what exists and what each one takes. The same full count now appears on the leaderboard's **Awards & Badges** panel too.

## 3. Operator vs operator

![Compare page in the gold theme: two operators side by side with a head-to-head ledger](/blog/new-signalaf-tour/compare.webp)

`/compare` puts two operators side by side. Choose operator A and operator B in the title bar. Each side gets an identity block plus two radars, one for the raw pillars and one for the cascade metrics. The center column is a head-to-head ledger: raw tokens, flow, cost and every derived metric, with a running count of metric wins. Underneath, Yield over time charts both operators on the same axis, where history exists.

When the matchup is worth showing someone, share it as a link, a PNG or a matchup card.

A note on what these numbers mean. Yield (Υ = cache read × output ÷ input²) describes a token-flow relationship. It does not measure correctness, code quality, effort or intelligence, and a comparison here is a comparison of operating shape, not of people.

## 4. Make it yours

![The same live board in the green, gold, bone and purple themes](/blog/new-signalaf-tour/themes.webp)

The workspace comes in four themes: **green**, **gold**, **bone** (the light one) and **purple**. Pick one from the account menu, or press **Shift+T** to cycle through them. Your choice is remembered.

![The rail in all five icon sets: pixel, glyph, emoji, minimal and hex](/blog/new-signalaf-tour/icon-sets.webp)

The rail on the left edge holds every section in two groups. **Operators** has Leaderboard, Profile, Compare and Hall. **Writings** has SigRank, Field, Articles, Blog and Wiki. It comes in five icon sets (pixel, glyph, emoji, minimal and hex), also switchable from the account menu.

## Also new

![Hall of Signal in the bone theme: record leaders by category](/blog/new-signalaf-tour/hall.webp)

- **Hall of Signal** shows the record holders in every metric and token category, with a badge gallery listing what each badge takes to earn.
- **The writing hub** (SigRank, Field, Articles, Blog and Wiki) shares one navigation, so research, guides and reference material are a click apart.

## Try it

Open the [live board](/board/all), find yourself with the search, and send a matchup to someone. To put your own operator on the board, run:

```
npx sigrank
```

It reads token counts only. Never your prompts.

*Screens captured from the live site on October 21, 2026. Rankings and numbers change as new submissions arrive.*
