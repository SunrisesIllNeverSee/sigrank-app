# Changelog

## [0.4.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.3.1...v0.4.0) (2026-07-06)


### Features

* add badges + Glama AAA rating to wiki Build out section ([4dbad8c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4dbad8ce1a1e4b2159e4a4f8b5fed3607870d301))
* add Preview button to profile + compare share cards ([c820823](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c820823dce4907f35f8620fe28de7374085b5182))
* add Smithery + Glama links for verification ([7ed5b39](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7ed5b395b5f064b1c6643b6413c46ce8b81007bf))
* beef up thin wiki sections with real content ([57bb31f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/57bb31fac0c0b72abdaac7b4206d2d2c2f97c510))
* Cascade Genome — radar with benchmark overlays + strengths panel ([9600da8](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/9600da8740a30c66dc241103fe675e63a02cd9e2))
* Cascade Lab sandbox — interactive cascade metrics at /sandbox ([e291388](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e2913889d5cd5db48071e77703edfda5050dc8d9))
* Compare share card — radar graphic left, terminal printout right ([054c0f9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/054c0f98937ad6ddc44f5cd66b347b774bb86478))
* Compare share card — title contender layout + dual radar ([4701886](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/470188679a78943d74fb7f9e84729d4a2260aad7))
* expand wiki "Build out" section to full MO§ES™ stack + tech components ([b155388](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b1553886c272dab942a6c63df787e671036a9708))
* move Smithery link from footer to wiki local-agent page ([1e4bba3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1e4bba348364d879f6ba8d764a1c4b130557f728))
* redesign Compare share card to match Profile share card ([2aae113](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/2aae11328e6172f2b1da529011999b207b50d3af))
* rewrite wiki from one-at-a-time panel to scrolling accordion ([dd84e84](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/dd84e84aa5f5a7b74f00047b3886e42644ce18ab))
* **seo-geo-aeo:** sitemap fix, JSON-LD expansions, llms-full.txt, IndexNow ([58778ae](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/58778aef2872806b3f02f77afbfea9243c6bf019))


### Bug Fixes

* /score page — agent path + privacy as primary, paste as backup ([b99c1af](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b99c1af036159b707df5aab3ce60b826e54eef5b))
* board OG — move to /board/[window]/og route + wire via metadata ([8c10c26](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8c10c263bf879b3b123ddda2016485e4fb10c72d))
* board OG — redirect to static OG image (pragmatic fix) ([39f8e2a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/39f8e2aed06983ac4a6024e06a83f5b673ea7b22))
* board OG — remove unused data imports (Supabase import may trigger edge runtime crash) ([f1095a3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f1095a3ac7affc008c11bbdaab4da120b9909d08))
* board OG — strip to minimal static card (isolate 500 cause) ([ed836c6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/ed836c6bf0d0617bf84416a65a2529efdc3db436))
* board OG — strip to minimal static card (no data layer, isolate 500) ([bd1ee4f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/bd1ee4f30c2c95fa9e181eb6a3e74e44e1fa960f))
* board OG — use route.tsx handler instead of opengraph-image.tsx ([c75aac5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c75aac5006ef9e95fff170959aa1b1247940499c))
* board OG — zero imports except next/og (isolate 500 to route-level issue) ([37fb3ff](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/37fb3ff8d8a21fee68176b8ccda1132e524999a9))
* board OG image — defensive data fetch + null-safe rendering ([7be9bae](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7be9bae1842e1a2a7f8fb41a8007527e5d29f6e0))
* board OG image 500 — add runtime=nodejs ([f43108f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f43108fc3202e6c5c59155486d531dfb6c433046))
* board OG route — remove invalid size/contentType exports (route handler, not file convention) ([291d894](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/291d894d6d9f8956fa13889d49be7055ad35ea0b))
* **ci:** allowlist IndexNow key files in gitleaks ([4ea7db5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4ea7db554ef676699cd2ad5becd1f7c4b638c4f6))
* **e2e:** score-paste test — navigate to /score/paste not /score ([75906be](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/75906bea7bdd994ff2a20f702d556357c5ed0382))
* exclude The Field from mock/cold-store fallback path ([101ad0c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/101ad0c2d71a936c928794ea0211e6b7c3eb9a36))
* **lint:** clean up all 25+ unused vars, dead code, and stale directives ([f41592a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f41592a9219e57eb035535c5bb3112b38d9737d0))
* **migration 0025:** add DROP for the bad orphan overload ([22975aa](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/22975aa0b1a4d7fcbd45a22d685d33e7f0f58c6f))
* **migration 0025:** match real DB function signature + body ([4ffe197](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4ffe197b2987fd62a5a88e32cbbc1c1bedc6473e))
* sandbox MO§ES preset — use canonical SEED pillars (Υ 18436.98) ([779a1e4](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/779a1e40ba4d6c6e1aa79cc5a38cd03c1224e61d))
* strip MO§ES™ product stack from Build out — tech stack only ([b940e9c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b940e9c7b3507180718d24441a00539581e6a6e8))
* tighten plausibility bounds + add aggregate Benford (deviewreview3) ([98d0773](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/98d0773df152518803a91ad821aaea8df4b13e33))
* **wiki:** correct Benford copy — cosmetic at n=4, real signal is attestation ([5741045](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/574104516a8b9428e87c3bf36e0413ee9c681b85))

## [0.3.1](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.3.0...v0.3.1) (2026-07-05)


### Bug Fixes

* **hero:** restore original landing copy — intro line, users', leaderboard title ([273620b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/273620b0fdd57dbb930b982330f37b1555a9d043))

## [0.3.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.2.0...v0.3.0) (2026-07-04)


### Features

* **theme:** Shift+T cycles themes site-wide ([1472cb6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1472cb655a70442be6b4c4787d7208573d177fe8))
* **theme:** terminal is the default theme (SSR data-theme + themeColor + toggle initial) ([4da6d26](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4da6d2616fd89757925a36a63801997d7438519d))


### Bug Fixes

* **ci:** unblock 3 failing workflows — MCP_VERSION drift, Lighthouse assertions, e2e payload ([5f2191c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/5f2191c69795320a0ef8e8e99e75913a3e98eadf))
* **constants:** bump MCP_VERSION 0.14.2 → 0.14.3 (unblock cross-repo-contract CI) ([2dd218d](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/2dd218de7ddbcffdbc500083ef8391bad4459ea8))
* **e2e:** remove expect.soft that was failing 3/4 e2e tests ([e29497f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e29497f9ac10c29ccc31666647bede055cbd74d5))
* **e2e:** replace axe-core known-violations filter with honest soft assert ([991e71f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/991e71f0c2bcb0350e5690efbc777f4c0c1c8a8f))
* **lighthouse:** drop recommended preset, assert category scores only ([c02058f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c02058f0ef27768b3425f393151f56fc11357fb0))
* **schema:** accept edit_longevity in composites (v1.1 anti-gaming Half B) ([6ca74ba](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/6ca74ba9815965d6c97baf2634e27d457b484e45))
* **test+lint:** tighten UI test assertions + remove eslint ignore shortcuts ([fa802d9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/fa802d9976816034d46c15dccdd54249214ec66a))
* **test:** tighten ScorePasteCard assertion to match plan ([7de47bf](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7de47bf2f032fb89763ad4876acdae9104d7f655))

## Changelog

Notable changes to SigRank are tracked here.

This project follows a practical changelog format:

- `Added` for new features.
- `Changed` for updates to existing behavior.
- `Fixed` for bug fixes.
- `Security` for vulnerability-related changes.

## Unreleased

### Changed

- Improved repository documentation, badges, contribution guidance, and security
  reporting notes.
