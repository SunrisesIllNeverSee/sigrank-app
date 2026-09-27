# SigRank App Repository Cleanup and Product-Protection Plan

Repository: SunrisesIllNeverSee/sigrank-app
Status: Proposed plan only — no repository changes authorized
Prepared: 2026-09-27
Primary objective: Clean and simplify the repository without deleting, moving, rewriting, or silently altering the live SignalAF product.

## 1. Executive decision

The repository should not be reorganized in one sweeping cleanup. The safe approach is a sequence of small, independently reversible pull requests:

1. freeze and inventory the current product;
2. remove only proven tiun-sdk debris and generated files;
3. verify the product is unchanged;
4. resolve CI separately;
5. classify the remaining folders before proposing structural moves;
6. move or consolidate only items with proven ownership, usage, and rollback paths.

The initial cleanup must be subtractive only and must not modify production application code, routes, schemas, migrations, public assets, database logic, or deployment configuration.

## 2. Evidence already confirmed

Current main contains approximately:

- 1,210 tracked files;
- 81 root-level directories;
- 54 tracked symlinks;
- more than 50 root-level tool directories created by the tiun-sdk installer;
- a surviving full tiun-sdk copy under agent/skills/tiun-sdk/;
- a surviving tiun-sdk record in skills-lock.json;
- approximately 52 broken tiun-sdk symlinks pointing to the deleted .agents/skills/tiun-sdk target;
- one tracked .swc generated binary of roughly 4 MB, despite /.swc now being ignored;
- no active files under .github/workflows/;
- eight workflows stored under _archived/workflows/ while README badges still reference active workflows;
- two archive roots (_archive/ and _archived/) plus Devins_Plans/;
- exact duplicate schema files in public and source locations, which may be intentional publication copies and must not be consolidated without provenance checks.

The tiun-sdk installation commit created a canonical skill plus aliases for many agent clients. The later removal deleted the canonical .agents/skills/tiun-sdk files in a sequence of small commits but left many aliases, another full copy, and the lock entry. The visible root-folder explosion is therefore mostly failed uninstall residue rather than product architecture.

## 3. Non-negotiable product protection rules

These rules apply to every cleanup phase.

**P-01 — No direct work on main**
All proposed changes occur on a dedicated branch and enter through a pull request. No force pushes, history rewrites, rebases of shared history, or direct commits to main.

**P-02 — Establish a recoverable baseline**
Before modifying anything:

- record the current main commit SHA;
- create a protected backup tag such as pre-repository-cleanup-2026-09-27;
- record the production deployment URL and current deployment identifier;
- capture the current database migration list;
- capture a repository tree manifest and hashes for protected files;
- preserve the existing production deployment so it can be redeployed without rebuilding from the cleanup branch.

The tag and manifest are recovery controls, not substitutes for tests.

**P-03 — Protected paths**
The first cleanup PR must not modify any of the following:

```
app/
components/
lib/
public/
supabase/
exchange-gateway/
standard/
governance/
methodology/
ontology/
observatory/
content/
data/                 except the proven broken data/skills/tiun-sdk symlink
datasets/
research/
papers/
scripts/
__tests__/
e2e/
middleware.ts
next.config.ts
open-next.config.ts
vercel.json
wrangler.jsonc
package.json
package-lock.json
tsconfig.json
```

Any unexpected diff in a protected path is a stop condition.

**P-04 — No database or production mutations**
Cleanup work must not:

- run Supabase migrations;
- alter production tables, policies, functions, storage, or secrets;
- run deployment commands;
- change environment variables;
- regenerate live leaderboard data;
- publish or remove public content;
- change DNS, Cloudflare, Vercel, or GitHub settings.

**P-05 — No uncertain deletion**
An item can be deleted only when all of the following are true:

1. its origin is identified;
2. it is not imported, invoked, linked, deployed, or externally referenced;
3. it is not the only copy of user-created work;
4. deletion is represented clearly in the PR;
5. restoration is possible from the backup tag;
6. required verification passes afterward.

Uncertain items are classified and deferred, not deleted.

**P-06 — One concern per PR**
Do not combine tiun cleanup, folder reorganization, CI restoration, dependency updates, SEO work, design work, or product changes in one PR.

## 4. Artifact classification system

Every top-level item should receive one classification before structural cleanup.

| Class | Meaning | Default action |
|---|---|---|
| A — Product runtime | Required by the running website or API | Protect; do not move |
| B — Product build/deploy | Required to build, test, deploy, or configure runtime | Protect; change only in dedicated PR |
| C — Authoritative domain asset | Standards, methodology, governance, ontology, research | Preserve; review organization later |
| D — Source-controlled developer tooling | Deliberately supported agent/editor configuration | Keep only with named owner and purpose |
| E — Generated artifact | Reproducible cache, binary, report, or build output | Untrack and ignore when safe |
| F — Historical archive | Useful record not used by runtime | Consolidate only after index and link review |
| G — Confirmed orphan/debris | Broken alias, removed-tool residue, unused installer output | Safe cleanup candidate |
| H — Unknown | Purpose or dependency not proven | Preserve and investigate |

No item moves directly from Unknown to Deleted.

## 5. Phase 0 — Baseline and recovery package

**Objective**
Create an evidence-backed snapshot of the working product before changing tracked files.

**Read-only inventory**
Record:

- current commit SHA and branch protection status;
- complete tracked-file manifest;
- tracked symlink list and targets;
- tracked-but-ignored files;
- top-level directories with file counts and last-touch commits;
- large tracked files;
- active GitHub Actions inventory;
- package scripts and dependency lock state;
- Supabase migration filenames and ordering;
- route inventory from app/;
- build and test commands currently expected to work;
- current public endpoints used for smoke testing.

**Baseline verification**
Run without modifying source:

```
npm ci
npx tsc --noEmit
npm run test:canonical
npm test
npm run test:ui
npm run build
```

Run E2E only against an approved local or preview environment. Do not point mutation-capable E2E tests at production.

**Baseline product smoke checks**
At minimum verify:

- homepage renders;
- live leaderboard renders;
- /user/the-field renders;
- /user redirects correctly;
- one real operator profile renders;
- methodology and FAQ render;
- sitemap and robots endpoints respond;
- API health/read endpoints used by the UI respond;
- no obvious console errors on primary pages;
- no production write is performed.

**Deliverables**

- baseline SHA;
- backup tag;
- inventory manifest;
- verification log;
- list of pre-existing failures, clearly distinguished from cleanup regressions.

**Stop conditions**
Stop before cleanup if:

- the repository cannot build from a clean checkout;
- critical tests are failing without explanation;
- the current production deployment cannot be identified;
- the database migration state cannot be recorded;
- branch protection or rollback access is unavailable.

## 6. Phase 1 — Complete the tiun-sdk removal

**Objective**
Remove only confirmed residue from the abandoned tiun-sdk skill installation.

**Proposed changes**

1. Remove every tracked broken symlink whose path ends in /skills/tiun-sdk and whose target is the missing .agents/skills/tiun-sdk.
2. Remove the surviving duplicate source directory:
   `agent/skills/tiun-sdk/`
3. Remove only the tiun-sdk object from skills-lock.json.
4. Preserve the legitimate Supabase skills and their Claude aliases.
5. Confirm that no production dependency, import, script, environment variable, route, or package references tiun.
6. Add a repository hygiene check that fails when a tracked symlink is broken.

**Expected visible result**
Most of these root directories should disappear automatically because Git does not track empty directories:

```
.aider-desk/ .augment/ .autohand/ .bob/ .codeartsdoer/ .codebuddy/
.codemaker/ .codestudio/ .commandcode/ .continue/ .cortex/ .crush/
.devin/ .factory/ .forge/ .goose/ .grok/ .hermes/ .iflow/
.inferencesh/ .jazz/ .junie/ .kilocode/ .kimchi/ .kiro/ .kode/
.lingma/ .mcpjam/ .minimax/ .moxby/ .mux/ .neovate/ .ona/
.openhands/ .pi/ .pochi/ .posit/ .qoder/ .qwen/ .reasonix/ .roo/
.rovodev/ .tabnine/ .terramind/ .tinycloud/ .trae/ .vibe/
.windsurf/ .zcode/ .zencoder/
```

`skills/` and `data/` may remain or disappear depending on whether they contain anything else. Their status must be determined from the staged diff, not assumed.

**Explicit exclusions**
Do not remove:

- .agents/skills/supabase/;
- .agents/skills/supabase-postgres-best-practices/;
- .claude/skills/supabase;
- .claude/skills/supabase-postgres-best-practices;
- unrelated .claude project instructions;
- any product directory merely because its name resembles an agent tool.

**Verification**

- zero tracked references to tiun;
- zero broken tracked symlinks;
- Supabase skill lock entries unchanged;
- protected-path hash manifest unchanged;
- TypeScript, canonical, unit, UI, and build results match baseline;
- product smoke checks match baseline.

**Rollback**
Revert the cleanup commit or reset the cleanup branch to the baseline SHA. Production remains on the pre-cleanup deployment until verification is complete.

## 7. Phase 2 — Generated-artifact cleanup

**Objective**
Remove reproducible machine-specific outputs without touching public product assets.

**Confirmed candidate**
`.swc/plugins/macos_aarch64_22.0.1/*.wasmer-v7`

This file is already matched by `/.swc` in .gitignore but remains tracked because it entered Git before the ignore rule.

**Proposed changes**

- remove .swc from the Git index in its own PR;
- retain `/.swc` in .gitignore;
- add a check for tracked files that are also ignored;
- document how the build regenerates the SWC artifact if relevant.

**Do not include**
Do not remove large files under `public/` during this phase. Public PDFs, images, GIFs, dashboard exports, screenshots, and marketplace assets may be deliberate website content. File size alone is not evidence of debris.

**Verification**

- clean install and build succeed on the intended development platform;
- deployment build succeeds without the committed binary;
- no protected product file changes;
- no public URL changes.

## 8. Phase 3 — CI and repository-control decision

**Objective**
Resolve the contradiction between archived workflows and README badges that advertise active automation.

**Current condition**
The repository contains no active `.github/workflows/*` files. Eight workflow files are stored in `_archived/workflows/`, including CI, CodeQL, dependency audit, E2E, Lighthouse, snapshot, and sync workflows. README badges still point to active workflow paths.

**Decision gate**
For each archived workflow classify it as:

- restore unchanged;
- restore after modernization;
- replace;
- intentionally retire.

**Recommended minimum restoration order**

1. ci.yml — type checking, canonical tests, unit tests, UI tests, build;
2. codeql.yml — security analysis;
3. dependency-audit.yml — dependency review/audit;
4. e2e.yml — only after confirming credentials, URLs, and write safety;
5. lighthouse.yml — only after confirming current deployment target;
6. scheduled snapshot/sync workflows — last, because they may write to repositories or external systems.

**Safety review before restoration**
Inspect every workflow for:

- write permissions;
- repository pushes;
- production deployments;
- secrets usage;
- scheduled jobs;
- Supabase writes;
- snapshot regeneration;
- stale Node/runtime versions;
- references to retired systems or branches.

No workflow with `contents: write`, deployment authority, database credentials, or scheduled mutations should be reactivated without explicit approval.

**Alternative**
If CI is intentionally retired, remove or replace the dead README badges and document the current verification process. Do not imply checks exist when they do not.

## 9. Phase 4 — Full top-level structure audit

**Objective**
Understand the remaining repository before proposing moves.

**Likely protected runtime/build areas**
These should remain stable unless the audit proves otherwise:

```
app/ components/ lib/ public/ supabase/ __tests__/ e2e/ scripts/
exchange-gateway/ content/ .github/ .agents/ .claude/ .ello/
```

**Domain and research areas requiring classification**

```
standard/ governance/ methodology/ ontology/ observatory/
datasets/ research/ papers/ data/
```

These names are conceptually related but may have distinct publication, URL, import, or governance roles. They should not be collapsed merely to make the root look cleaner.

**Archive and report areas requiring consolidation review**

```
_archive/
_archived/
Devins_Plans/
posthog-mcp-analytics-report.md
```

For every candidate move, check:

- imports and filesystem reads;
- Markdown links;
- GitHub issue/PR links;
- published URLs;
- scripts and workflow references;
- external documentation references;
- whether filename or path carries canonical meaning.

**Proposed target, subject to audit**

```
archive/
  drafts/
  migrations/
  reports/
  retired-workflows/

docs/
  operations/
  architecture/
```

This is a discussion model, not an approved move map.

**Placeholder directories**
`datasets/`, `research/`, and `papers/` currently contain placeholder README files. They may represent intentional future repository architecture. Options to evaluate:

1. keep them as declared future boundaries;
2. move the declarations into one research roadmap document;
3. remove them only if the intended architecture has been abandoned.

Default: preserve until explicitly decided.

## 10. Phase 5 — Canonical-source and duplication audit

**Objective**
Determine whether exact duplicate files are intentional projections or accidental copies.

**Known exact duplicates**

```
standard/schema/sigrank-operator-record-v0.1.schema.json
public/standard/sigrank-operator-record-v0.1.schema.json

exchange-gateway/exchange.schema.json
public/exchange.schema.json
```

The likely pattern is an authoritative source plus a public website projection. If confirmed, preserve both paths but automate synchronization and add a drift check. Do not replace them with symlinks unless deployment infrastructure is proven to preserve and serve symlinks correctly.

**Required decision for each pair**

- Which path is authoritative?
- Which path is published?
- Is copying part of a build step or manual?
- What consumes each path?
- Can CI detect drift?

**Preferred outcome**
One authoritative source, one explicit generated/public projection, and a verification check—without changing public URLs.

## 11. Phase 6 — Large asset and repository-size review

**Objective**
Reduce avoidable repository weight without breaking pages or losing original work.

**Current large-file examples**

- dashboard PDF around 9.7 MB;
- full dashboard PNG around 8.2 MB;
- several dashboard and marketplace images between roughly 1–4 MB;
- showcase GIF around 1.1 MB.

**Review questions**

- Is the file served by a live page?
- Is it the only original/high-resolution copy?
- Could WebP/AVIF or optimized PDF reduce size?
- Does changing it alter a public URL?
- Is historical Git size the real concern, or only current checkout size?

**Rules**

- no asset deletion based solely on size;
- retain originals until optimized replacements are visually verified;
- preserve public paths or provide redirects where URLs are public;
- do not rewrite Git history merely to reduce repository size without a separate risk review.

## 12. Verification matrix for every cleanup PR

| Control | Required result |
|---|---|
| Diff scope | Only approved paths changed |
| Protected manifest | No unexpected hash changes |
| Broken tracked symlinks | Zero |
| Tracked ignored files | Zero, or documented exceptions |
| TypeScript | Same as or better than baseline |
| Canonical tests | Pass |
| Unit tests | Pass |
| UI tests | Pass |
| Production build | Pass |
| Route inventory | No route removed or renamed |
| Public asset inventory | No unexpected removal |
| Supabase migrations | Identical |
| Package dependencies | Identical unless the PR is dependency-specific |
| Environment contract | Identical |
| Preview smoke test | Matches baseline |
| Production deployment | Not triggered automatically |

Any unexpected change blocks merge.

## 13. Pull request sequence

**PR-0 — Baseline only**
Preferably documentation/evidence only. Records SHA, tag, manifests, routes, migrations, checks, and pre-existing failures.

**PR-1 — Complete tiun-sdk removal**
Broken aliases, surviving duplicate skill, lock entry, and broken-symlink regression check only.

**PR-2 — Untrack generated .swc**
Generated binary removal and tracked-ignore regression check only.

**PR-3 — CI truthfulness**
Either restore reviewed minimum CI or correct README/status documentation. Do not mix this with product work.

**PR-4 — Archive consolidation**
Only after a move map, reference scan, and explicit approval.

**PR-5 — Canonical-source synchronization**
Add drift checks or generation rules for duplicate source/public schemas.

**PR-6 — Optional asset optimization**
Only after route usage and visual-equivalence review.

## 14. Merge and deployment protocol

For each PR:

1. start from the verified baseline or latest verified main;
2. apply only the approved scope;
3. inspect the full diff, including file modes and symlink targets;
4. verify protected-path hashes;
5. run the verification matrix;
6. build a preview without production credentials where possible;
7. manually smoke-test the preview;
8. require explicit approval before merge;
9. merge without bundling unrelated changes;
10. observe the normal deployment without running database changes;
11. repeat the smoke checks;
12. roll back immediately if behavior differs.

Do not begin the next cleanup phase until the prior phase is verified.

## 15. Rollback protocol

**Code rollback**

- revert the individual cleanup PR;
- redeploy the last known-good commit or retained production deployment;
- do not repair a cleanup regression by layering unrelated fixes onto it.

**Database rollback**
Not applicable to cleanup PRs because database modifications are prohibited. Any observed database change is an incident and stop condition.

**File recovery**
Restore deleted or moved files from the protected baseline tag. Avoid copying from memory or reconstructing user-authored content.

**Incident record**
Record:

- affected route or behavior;
- first bad commit;
- verification control that missed it;
- rollback performed;
- new regression check required.

## 16. Repository hygiene controls to add

After immediate cleanup, introduce small automated checks:

1. Broken symlink check — fail on any tracked symlink whose target is absent.
2. Tracked-ignore check — report files that are both tracked and ignored.
3. Root allowlist or budget — flag unexpected new root-level directories for review.
4. Skill installation policy — one canonical skill location; aliases must be declared and tested.
5. Generated-file policy — caches and platform binaries remain untracked.
6. Canonical-copy drift check — verify source/public schema projections match.
7. README badge check — advertised workflows must exist.
8. Migration immutability check — historical Supabase migrations cannot be silently edited.
9. Protected-path diff check for cleanup PRs — optional label-driven guard.

## 17. Decisions requiring explicit approval

The following are not pre-approved by this plan:

- deleting or moving any product/runtime directory;
- consolidating standard, governance, methodology, ontology, or observatory;
- deleting research placeholders;
- restoring scheduled or write-enabled workflows;
- changing README claims or badges;
- optimizing or deleting public assets;
- altering duplicate schema paths;
- rewriting Git history;
- deploying cleanup changes to production;
- changing GitHub repository settings or branch protections.

## 18. Recommended immediate authorization boundary

The safest first authorization, if approved later, is:

> Create a cleanup branch from the recorded baseline. Remove only confirmed tiun-sdk residue and the tiun lock entry; add a broken-symlink check; do not touch protected product paths, dependencies, database files, configuration, public assets, workflows, routes, or deployment settings. Run the full baseline comparison and return the diff for approval before any merge.

This first step removes most visible clutter while preserving the product boundary.

## 19. Final acceptance criteria

The repository cleanup is complete only when:

- the live product behaves identically to the approved baseline;
- no route, public asset, schema contract, migration, or deployment setting was lost;
- no broken tracked symlinks remain;
- no abandoned tiun-sdk references remain;
- generated machine artifacts are untracked;
- CI status is truthful and documented;
- every root-level directory has a named purpose and classification;
- authoritative sources and public projections are identified;
- archive structure is intentional and indexed;
- future installers cannot recreate the same root-folder explosion unnoticed;
- every completed change remains individually reversible.
