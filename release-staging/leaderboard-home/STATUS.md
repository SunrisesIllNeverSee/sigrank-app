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
