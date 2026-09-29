# PR-3A decision record — retire automatic five-day snapshots

**Date:** 2026-09-28
**Status:** Retired (formalizes what PRs #108/#114 already did operationally)
**Owner decision:** Deric, 2026-09-28

## What was retired

`_archived/workflows/snapshot-archive.yml` ran every 5 days (plus manual
dispatch): created an annotated git tag `snapshot-YYYY-MM-DD-v<pkg>` and a
matching GitHub Release as a rollback marker.

- Ran 2026-07-07 → 2026-09-01: **11 snapshots**
  (`snapshot-2026-07-07-v0.5.0` … `snapshot-2026-09-01-v0.11.1`).
- Stopped when all workflows were archived (Sep 9) — and nothing missed it
  operationally for ~4 weeks, which is itself evidence the cadence exceeded
  actual need.
- Scope note: it captured **git state only** — it never protected database or
  production data. Recovery semantics were always "redeploy this commit."

## Rationale (owner)

Git history, Vercel instant-rollback, milestone/release tags, and the
preserved cleanup tag already provide the recovery surface. Automatic
five-day tags/releases add repository clutter without meaningful additional
protection.

## What is preserved (nothing deleted)

- All 11 `snapshot-*` tags remain in the repository and on origin.
- All matching GitHub Releases remain published.
- `pre-repository-cleanup-2026-09-27` (annotated, → `735ac89`) remains the
  protected cleanup baseline.
- `backup/pre-major-2026-09-27` branch + `snapshot/pre-major-2026-09-27` tag
  remain.
- The workflow file stays at `_archived/workflows/snapshot-archive.yml`
  untouched until PR-4 archive consolidation decides its disposition.

## Replacement policy — manual annotated tags

Before any high-risk repository operation (bulk cleanup phases, dependency
surgery, anything touching history or broad file sets):

```bash
git tag -a pre-<operation>-YYYY-MM-DD -m "baseline before <operation>" && \
git push origin pre-<operation>-YYYY-MM-DD
```

This convention was already exercised: `pre-repository-cleanup-2026-09-27`
was created exactly this way before Phase 1.

## Recovery layers that remain

| Layer | Covers | Mechanism |
|---|---|---|
| Git history + tags | code state | immutable commits, preserved tags |
| Vercel deployments | production site | instant redeploy of any prior deployment |
| Manual annotated tags | pre-operation baselines | policy above |
| Supabase | data | **outside this mechanism** — snapshot-archive never covered it; DB backups are Supabase-managed |

## Reversal

If the policy is ever revisited: restore
`_archived/workflows/snapshot-archive.yml` to `.github/workflows/` — a single
file move, no other coupling exists (the workflow wrote only tags/releases).
