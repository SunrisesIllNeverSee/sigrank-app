# New homepage / leaderboard — active parallel work

Live pages: / and /board/all.
Owner: separate GPT session, not the editorial GPT.
Code areas: app/page.tsx, app/board/, components/live/, lib/board/, app/api/v1/leaderboard/.
References: _workspace/leaderboard-parity-audit, _workspace/board-reference-archive, _workspace/LEADERBOARD_DESIGN_CHANGELOG.md.
PR: https://github.com/SunrisesIllNeverSee/sigrank-app/pull/239

- [x] Routes respond on local site.
- [x] Owner has detailed design/parity evidence.
- [ ] Other GPT freezes a precise current implementation and confirms scope.
- [ ] HITL/Hybrid/Autonomous filter gates, initial state and eligibility review.
- [ ] Ranked + signed-up unranked roster; real signup counts and consent: no invented ranks or public private data.
- [ ] Sorting, column math, API, pagination and current UI parity; screenshots desktop/mobile.
- [ ] Scoped tests, PR review, CI and owner release signoff.

State: IN FLIGHT. RELEASE READY NO. DEPLOYED NO.
Do not alter or checkpoint another session's changing code as a final build.


## 2026-10-12 — UR ruleset, canonical staged website (local candidate)
- UR = registered plus no qualifying ranked snapshot. UR is a membership
  status, not HITL/Autonomous proof, a fourth filter, or a zero-token submission.
- Membership positions derive from real authenticated account links,
  anti-joined with qualified ranks. Verified population: 22 ranked +
  29 UR members, positions #23 to #51; Hybrid includes all 51.
- UR is displayed in Hybrid and the Autonomous review group as requested,
  but excluded from ranks, podiums, averages, percentiles, throughput,
  performance denominators and scoring. Metric cells show dash, not zeros.
- Only the registered headcount includes UR. Private identities remain hidden.
- Server UR contract in lib/board/unranked-status.ts; route at
  app/api/v1/board/signup-summary/route.ts; view at
  components/live/LiveBoardWorkspace.tsx.
- Local staged worktree only; not merged or deployed.
