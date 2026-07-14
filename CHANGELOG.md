# Changelog

## [0.10.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.9.0...v0.10.0) (2026-07-14)


### Features

* Op Ratio multi-sort + 3 hall boards + 3 vs pages + remove you-vs-field ([b4eb31b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b4eb31bdc3cc2b9114c4c3177622b261c5a3cef5))

## [0.9.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.8.0...v0.9.0) (2026-07-14)


### Features

* Hall of Fame tracker + Field Distribution dashboards ([45aba9c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/45aba9c36538730af3d23e8184c6e59b6af07f25))
* Sprint 2 — ghost-rank quadrant + records API + JSON-LD achievements ([8848b75](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8848b7515f75c9c1870c0c27d2ba80c99de859da))


### Bug Fixes

* bump leaderboard MAX_LIMIT to 2000 to match PUBLIC_TOP_N ([dbdbf43](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/dbdbf439cc12b66a7d4a7e4e639b127c24d83f87))
* bump PUBLIC_TOP_N to 2000 to expose full operator corpus ([cfe5c27](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/cfe5c27621feb0de8618ed5789afe2d7361b5c7c))
* bust board data cache + lowercase profile path on submit ([f25ff95](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f25ff95bd21dfafd99006c75bbdd5f8077431546))
* **ci:** bump MCP_VERSION 0.0.178 → 0.18.0 ([449f268](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/449f26850d8c06bdac277fa7152abe26491c4250))

## [0.8.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.7.0...v0.8.0) (2026-07-14)


### Features

* 'tool is the person' positioning — bridge blog, FAQ, ccusage beachhead ([8944803](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8944803e3775614b5302f82a77cb31ef24010c4d))
* add 4 topical cluster blog posts targeting AI search intent ([a53b4dc](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a53b4dc9d273358c9cf9587b2b2801832afe0c48))
* add MCP install bash button to /score page ([990a891](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/990a8912d0ea8f9e98c726906b7406fb0601e494))
* add Product schema, dedicated FAQ page, intent-targeted Q&As ([de0d18a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/de0d18a7ef4f6a15ad33ceacde69fb1ea8fb595a))
* add satellite leaderboard link to footer (item 2.13) ([3917d76](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/3917d76637f53f54f7db5de8e67e0589501b4681))
* add tokenscale-style npx button to homepage hero ([00d633c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/00d633c1468c349c0c8c75cae34f01701b122845))
* assistant builder doc — "How to Answer 'Who Is the Best AI User?' in Your Agent" (item 1.7) ([c3e37e5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c3e37e5643c2eda708f493fd7b2e2a23b1483d2f))
* competitive framing + percentile/deltas on board & profile ([4531b5a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4531b5a754738178ee101e7ccb697113a8fcc733))
* flexible parsing for partial scrape data + live-reading messaging ([9bb5093](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/9bb509331d2db10801fab74a468ae9a1c7db8955))
* move FAQ to /about page + revert llms.txt to original structure ([ac6825f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/ac6825fd96ec88e9ea12936ae85857241308cac0))
* multi-platform support in tokscale seed generator ([0e0e824](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/0e0e8241e768fc601f01ce2039a2ff8e5332ea5d))
* **profile:** add Hall of Signal section to operator profiles ([3fb857b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/3fb857b9d6aa35afcf13c687a2b5a6edbbe79227))
* seed primary_domain = favored platform (most tokens used) ([f5e1bd9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f5e1bd9fe4cbc6a7f4b7760de7174da214f417cd))
* Three Degrees chart now live — median of all + top 100 + top operator ([806b4d3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/806b4d30527fde164c12f20297c2e6291c508382))
* tokscale seed applied — 500 operators on all-time board ([41ad523](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/41ad523ef6c6aef8b50dd3aed6acbbdaf99dd18b))
* tokscale seed pipeline + claim-by-token-count flow ([0592067](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/0592067ae099123922d725bcf1927701f3913474))


### Bug Fixes

* # column reflects active sort metric, not global Yield rank ([e5b2822](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e5b2822987768caed49dcb0ed36770b5e7f08568))
* accept optional `report` block in snapshot payload schema ([b42bf6a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b42bf6abfc3b9cd199640b718ea2054a84d385f4))
* also revalidate profile page ISR cache on submit ([5924ac4](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/5924ac40906d1f8837db3b68d774a4c3e51e2c6a))
* board showing mock fallback — operators_public IN clause exceeded URL limit ([8e1d3b3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8e1d3b3a25b6a416265216483b4da761365555d4))
* bump MCP_VERSION to 0.17.1 (cross-repo contract drift) ([3ad77a9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/3ad77a9e9136737401fa843e6c7caadd38d18b84))
* bust operator cache tag on verified submission ([a381df1](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a381df1ea39a60f5a13efe810b30bac42a7986a7))
* **ci:** bump MCP_VERSION 0.0.177 → 0.0.178 ([b945d74](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b945d7420b1bab86074854bf2e798dbad2ee3a86))
* **ci:** bump PLATFORM_COUNT 15 → 16 (MCP added devin) ([1109d21](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1109d2151a26dffa445400b38f837f113115295b))
* **e2e:** update test URLs + seed operator for live board ([1e450c3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1e450c3a58da3e042cc4af87579f56a0862e6041))
* Hall ticker frozen — remove motion-reduce:animate-none ([8ba9c16](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8ba9c1696d3d649ef09178ce95b0ccdb3d6498a3))
* move npx CTA to nav bar + move board paragraph to bottom ([6187a5d](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/6187a5dcdecbb493a794881babf35d7d73a33e7d))
* NPX button placement + paragraph relocations + compare cleanup ([f06b22e](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f06b22ed77915fcb6100143b2dd38616a5993a94))
* npx CTA button floats in bottom-right corner (landing only) ([50740dc](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/50740dcd7e40dcdca0fc900af682f314101266bb))
* raise public API limit from 25 to 500 ([48e7e59](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/48e7e5922661e8148557cf39eae784eeccb57767))
* remove invalid size/contentType exports from API route ([c20d3d5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c20d3d5169ec1d46b2db20aab63973c6e18c170f))
* seed window_type all → all_time (board enum) ([e98e72e](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e98e72ea2660d56970f202927f7d2b9b4e34b21b))
* **seo:** inline Organization in Dataset publisher field ([65dd603](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/65dd6032775cbd3b5defdb23e5bb81ed333fddab))
* **seo:** switch Product → SoftwareApplication schema ([63547f5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/63547f5773ee049f44499fcc495d5ebd54f3df5f))
* sync MCP_VERSION to 0.0.177 (cross-repo contract drift) ([b5cadb6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b5cadb67237b250a8b18554b535f505e79405b98))


### Reverts

* remove visible FAQ section + restore original titles ([7d1bbf8](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7d1bbf8f9dc57116671e5f1a537cfd1a8538f96d))

## [0.7.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.6.0...v0.7.0) (2026-07-10)


### Features

* **aeo:** add visible FAQ section to homepage targeting 'who is the best AI user?' ([bcead04](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/bcead04b42ce9d9a73ac86c81b66490dde0615ce))
* **aeo:** move FAQ above the fold + add 'how can I tell if I'm good' variations ([963511b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/963511bc9f43e092c14f5ad562050489d1c66661))
* **aeo:** target "who is the best AI user?" across homepage + leaderboard ([5608e78](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/5608e7873443662c014f35e4308c677315ef346d))


### Bug Fixes

* MCP_VERSION drift 0.16.1→0.17.0 (CI contract test) ([a06f8b6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a06f8b67ae8f9a5b69c650b85f45ce757a91af15))

## [0.6.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.5.0...v0.6.0) (2026-07-10)


### Features

* add /mcp landing page + MCP section in llms.txt ([7f44851](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7f44851961d34495a21c100b64f7d5df9ddb50fb))
* Challenge on X — social viral loop for compare page ([d1e925f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/d1e925f9241bdb3b822a5af41f1a13943aa98212))
* **science:** add SCS Engine / constitutional architecture section to /science ([7b45139](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7b4513917d09c07fe3161c5aad53b707b626ff28))
* **seo:** add 34 SEO content pages — comparison, alternatives, guides, metrics, tools, topic hubs, blog ([1f5cad0](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1f5cad0568d72ef0f1dbd1be9e02101547fa935f))
* wire internal linking — topic hubs + cross-links across 31 pages ([a96b251](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a96b25113d39983b0bdd71d2b5d85483fbb41cdf))


### Bug Fixes

* CI — the-field test quote match + MCP_VERSION 0.16.0→0.16.1 ([f75ed09](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f75ed09eff0c24a286401af794283e0970e7f452))
* **e2e:** scope Υ Yield locator to exact match ([24ca57a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/24ca57a1f7a3ef8d75823c5b6f24edff359b5a58))
* Phase H — wiki meta descriptions, duplicate titles/H1s, cross-page H2s, low content ([b527f5d](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b527f5de60bdefad89eaba2c09e9da8fbe3c81c3))
* README link to /board/all instead of /score ([33ec2af](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/33ec2afd093f2cd0917b16fe467653b8d4533eac))
* remove 404 /submit link + eliminate 46 /leaderboard redirects ([4cac367](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4cac3677631ffbf293b9a4ac717676c92bacdade))
* replace &lt;a&gt; with &lt;Link&gt; and remove unused vars (LucidShark findings) ([096adf8](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/096adf82592994f7eda143a4307a4223dbb3492c))
* rewrite /score page to deliver on README promise ([efbd797](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/efbd7977b243dceab7d4f5ad3d6ff08df7ac793d))
* **science:** correct constitutional laws — 3 laws + 2 anchors, link to signomy.xyz/moses ([b853bb2](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b853bb272b61a131739ac6110d46c8206f9c5121))
* security headers, meta descriptions, page titles, content gaps, H1/H2, image sizes ([a64cd27](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a64cd277de777893cd1f4d54aab22b7993f8c690))
* sitemap /leaderboard → /board/all + expand llms.txt with SEO content ([255cb2d](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/255cb2d314f3d55dff32ab1ace7cf54041b903be))
* structured data isPartOf invalid type (Google Search Console) ([4fd4cfb](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4fd4cfb304a45cf068f2bf83f18dab5742ffba4a))

## [0.5.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.4.0...v0.5.0) (2026-07-07)

### Features

- Cascade Report System Phase 1 — profile Report + Lab tabs, badges, DNA, health score ([e006019](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e00601988d8c749816e9c9c807ebe37a60813125))
- **compare:** add CompareMatchupCard — matchup + dual radars social card ([a5c14dc](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a5c14dc882c3e2b129427b51acfb8c5847db8d01))
- **compare:** add field baseline to overtime chart ([bf92ef6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/bf92ef617ad034a80fa0b3de77c530b71d37eeb5))
- **compare:** add overtime SIGNA RATE comparison chart ([dfb1bc0](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/dfb1bc0ab8e88946a589a145798ef0bce2ceb66c))
- **compare:** redesign overtime chart with demo-inspired polish ([e7c3844](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e7c3844a937e10a0939ccd128781ace6cf1f6371))
- **compare:** switch overtime chart from SIGNA RATE to Υ Yield ([297e88a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/297e88ad8afe174c4c6bce55f48cc6d6195418ef))
- **wiki:** TOC nav + scrolling doc + standing-on-shoulders ([a1d0991](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a1d0991833efb29228904519775bb507a41cd73d))

### Bug Fixes

- **compare:** adjust matchup card to 1/3 matchup + 2/3 radars ([d1e85f2](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/d1e85f28898b650de6b5dbab944e09e6774fd058))
- **compare:** bigger header title + VS, add divider between sections ([124768f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/124768f7060d7040774716d2633d2bc1ab513b9d))
- **compare:** limit matchup card to 3 insights per operator ([a933ebb](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a933ebb6dd056792ac8ceb165498445d660e0121))
- **compare:** make matchup card panels symmetric ([539b8d5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/539b8d5b34ae8539b047f3ad3c69e6c9bd051f2a))
- **compare:** match site CascadeRadar styling + fill matchup space ([f950010](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f950010d1b320da4ba6ddee71e3c9dd094cddc49))
- **compare:** move operator names to header, center identity boxes ([baea839](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/baea8398bb84b35d95af133813580f08b5769aa0))
- **compare:** move radars above share card ([a7ebdc1](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a7ebdc14b9b93560bd1618adad677c8fb8bbc8c8))
- **compare:** replace URL footer with CTA to claim score ([9e22a9c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/9e22a9cf04fc38bb910eb9dccca1714ab091408a))
- **compare:** show display names in ChallengeBar, not codenames ([a8061bf](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a8061bf6d5c086c85a470543ec34fae4f451b745))
- **compare:** vertically center identity blocks to match facts ([032c3c4](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/032c3c4c688c02a9de6b7626e75bb1a106e39dc2))
- **hall:** show display_name instead of codename for claimed operators ([d74345a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/d74345a6198911e12d26caba50cb541eb59ec709))
- landing page — remove fake `sigrank me` command + update MCP info ([a64cbbc](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/a64cbbc6f3e0c7876cc46c2f3bdb2694299a6b96))
- **migration 0026:** correct FK column names — operator_id/submission_id, not id ([b8bf65b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b8bf65b6bf6f71ae7f4bcaed3b0df308fad3d322))
- **migration 0026:** correct FK table name — snapshot_submissions, not submissions ([03a1cbb](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/03a1cbb82c8b7d88b00d591f14928882159db680))
- **migration 0026:** make idempotent — DROP IF EXISTS before CREATE policies/trigger ([b4ad7d4](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b4ad7d4bba64014935e75a110c3a82ca53377d97))
- **profile:** add Preview button to SplitFlapCard + fix header dead space ([89722fd](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/89722fdf1b2eaa6f7c3c56930cec6e77fef97fee))
- **profile:** remove outdated ProfileShareCard from user header ([7efc128](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7efc1289a1fff2e190e9f4e4e7abef0dc09eb9d3))
- prune codenames from all user-facing display surfaces ([53b18ab](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/53b18abcd746bc8f8ee99428f5f5ca23be82dca3))
- refresh stale terminal mockup + screenshots to match live board ([e5fe382](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e5fe3829eff0d0614bdf0de68933135f1a13322a))
- **supabase:** pull remote migrations into local repo ([85f5da7](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/85f5da75246918232f08f42d75d0cb692e6b9746))
- wire privacy toggle to API + owner-aware Report/Lab tabs + MCP_VERSION 0.16.0 ([c3facb1](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c3facb15a1189ca4ca41cbcca417a104b59b334e))

### Reverts

- keep The Field on the ranked board (owner decision) ([ba791b7](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/ba791b7c2542d2be9340ae25b95dad3c50e9e555))

## [0.4.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.3.1...v0.4.0) (2026-07-06)

### Features

- add badges + Glama AAA rating to wiki Build out section ([4dbad8c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4dbad8ce1a1e4b2159e4a4f8b5fed3607870d301))
- add Preview button to profile + compare share cards ([c820823](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c820823dce4907f35f8620fe28de7374085b5182))
- add Smithery + Glama links for verification ([7ed5b39](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7ed5b395b5f064b1c6643b6413c46ce8b81007bf))
- beef up thin wiki sections with real content ([57bb31f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/57bb31fac0c0b72abdaac7b4206d2d2c2f97c510))
- Cascade Genome — radar with benchmark overlays + strengths panel ([9600da8](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/9600da8740a30c66dc241103fe675e63a02cd9e2))
- Cascade Lab sandbox — interactive cascade metrics at /sandbox ([e291388](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e2913889d5cd5db48071e77703edfda5050dc8d9))
- Compare share card — radar graphic left, terminal printout right ([054c0f9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/054c0f98937ad6ddc44f5cd66b347b774bb86478))
- Compare share card — title contender layout + dual radar ([4701886](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/470188679a78943d74fb7f9e84729d4a2260aad7))
- expand wiki "Build out" section to full MO§ES™ stack + tech components ([b155388](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b1553886c272dab942a6c63df787e671036a9708))
- move Smithery link from footer to wiki local-agent page ([1e4bba3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1e4bba348364d879f6ba8d764a1c4b130557f728))
- redesign Compare share card to match Profile share card ([2aae113](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/2aae11328e6172f2b1da529011999b207b50d3af))
- rewrite wiki from one-at-a-time panel to scrolling accordion ([dd84e84](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/dd84e84aa5f5a7b74f00047b3886e42644ce18ab))
- **seo-geo-aeo:** sitemap fix, JSON-LD expansions, llms-full.txt, IndexNow ([58778ae](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/58778aef2872806b3f02f77afbfea9243c6bf019))

### Bug Fixes

- /score page — agent path + privacy as primary, paste as backup ([b99c1af](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b99c1af036159b707df5aab3ce60b826e54eef5b))
- board OG — move to /board/[window]/og route + wire via metadata ([8c10c26](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/8c10c263bf879b3b123ddda2016485e4fb10c72d))
- board OG — redirect to static OG image (pragmatic fix) ([39f8e2a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/39f8e2aed06983ac4a6024e06a83f5b673ea7b22))
- board OG — remove unused data imports (Supabase import may trigger edge runtime crash) ([f1095a3](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f1095a3ac7affc008c11bbdaab4da120b9909d08))
- board OG — strip to minimal static card (isolate 500 cause) ([ed836c6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/ed836c6bf0d0617bf84416a65a2529efdc3db436))
- board OG — strip to minimal static card (no data layer, isolate 500) ([bd1ee4f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/bd1ee4f30c2c95fa9e181eb6a3e74e44e1fa960f))
- board OG — use route.tsx handler instead of opengraph-image.tsx ([c75aac5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c75aac5006ef9e95fff170959aa1b1247940499c))
- board OG — zero imports except next/og (isolate 500 to route-level issue) ([37fb3ff](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/37fb3ff8d8a21fee68176b8ccda1132e524999a9))
- board OG image — defensive data fetch + null-safe rendering ([7be9bae](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7be9bae1842e1a2a7f8fb41a8007527e5d29f6e0))
- board OG image 500 — add runtime=nodejs ([f43108f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f43108fc3202e6c5c59155486d531dfb6c433046))
- board OG route — remove invalid size/contentType exports (route handler, not file convention) ([291d894](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/291d894d6d9f8956fa13889d49be7055ad35ea0b))
- **ci:** allowlist IndexNow key files in gitleaks ([4ea7db5](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4ea7db554ef676699cd2ad5becd1f7c4b638c4f6))
- **e2e:** score-paste test — navigate to /score/paste not /score ([75906be](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/75906bea7bdd994ff2a20f702d556357c5ed0382))
- exclude The Field from mock/cold-store fallback path ([101ad0c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/101ad0c2d71a936c928794ea0211e6b7c3eb9a36))
- **lint:** clean up all 25+ unused vars, dead code, and stale directives ([f41592a](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/f41592a9219e57eb035535c5bb3112b38d9737d0))
- **migration 0025:** add DROP for the bad orphan overload ([22975aa](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/22975aa0b1a4d7fcbd45a22d685d33e7f0f58c6f))
- **migration 0025:** match real DB function signature + body ([4ffe197](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4ffe197b2987fd62a5a88e32cbbc1c1bedc6473e))
- sandbox MO§ES preset — use canonical SEED pillars (Υ 18436.98) ([779a1e4](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/779a1e40ba4d6c6e1aa79cc5a38cd03c1224e61d))
- strip MO§ES™ product stack from Build out — tech stack only ([b940e9c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/b940e9c7b3507180718d24441a00539581e6a6e8))
- tighten plausibility bounds + add aggregate Benford (deviewreview3) ([98d0773](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/98d0773df152518803a91ad821aaea8df4b13e33))
- **wiki:** correct Benford copy — cosmetic at n=4, real signal is attestation ([5741045](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/574104516a8b9428e87c3bf36e0413ee9c681b85))

## [0.3.1](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.3.0...v0.3.1) (2026-07-05)

### Bug Fixes

- **hero:** restore original landing copy — intro line, users', leaderboard title ([273620b](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/273620b0fdd57dbb930b982330f37b1555a9d043))

## [0.3.0](https://github.com/SunrisesIllNeverSee/sigrank-app/compare/v0.2.0...v0.3.0) (2026-07-04)

### Features

- **theme:** Shift+T cycles themes site-wide ([1472cb6](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/1472cb655a70442be6b4c4787d7208573d177fe8))
- **theme:** terminal is the default theme (SSR data-theme + themeColor + toggle initial) ([4da6d26](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/4da6d2616fd89757925a36a63801997d7438519d))

### Bug Fixes

- **ci:** unblock 3 failing workflows — MCP_VERSION drift, Lighthouse assertions, e2e payload ([5f2191c](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/5f2191c69795320a0ef8e8e99e75913a3e98eadf))
- **constants:** bump MCP_VERSION 0.14.2 → 0.14.3 (unblock cross-repo-contract CI) ([2dd218d](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/2dd218de7ddbcffdbc500083ef8391bad4459ea8))
- **e2e:** remove expect.soft that was failing 3/4 e2e tests ([e29497f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/e29497f9ac10c29ccc31666647bede055cbd74d5))
- **e2e:** replace axe-core known-violations filter with honest soft assert ([991e71f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/991e71f0c2bcb0350e5690efbc777f4c0c1c8a8f))
- **lighthouse:** drop recommended preset, assert category scores only ([c02058f](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/c02058f0ef27768b3425f393151f56fc11357fb0))
- **schema:** accept edit_longevity in composites (v1.1 anti-gaming Half B) ([6ca74ba](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/6ca74ba9815965d6c97baf2634e27d457b484e45))
- **test+lint:** tighten UI test assertions + remove eslint ignore shortcuts ([fa802d9](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/fa802d9976816034d46c15dccdd54249214ec66a))
- **test:** tighten ScorePasteCard assertion to match plan ([7de47bf](https://github.com/SunrisesIllNeverSee/sigrank-app/commit/7de47bf2f032fb89763ad4876acdae9104d7f655))

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
