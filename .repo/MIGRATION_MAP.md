# Migration Map — sigrank-app

**Installed:** 2026-08-18
**Mode:** migrate
**Profile:** product

## Existing structure preserved

All existing root directories declared in `allowed_root_dirs_extra`:
- `__tests__/`, `app/`, `components/`, `content/`, `datasets/`, `e2e/`,
  `governance/`, `lib/`, `methodology/`, `observatory/`, `ontology/`,
  `papers/`, `research/`, `supabase/`, `workflows/`
- `Devins_Plans/` — pre-standard DREP coordination (preserved as historical record)

## Pre-existing coordination

- `Devins_Plans/` with legacy `Drep1`/`Drep2` naming — preserved, not modified
- No prior `system-devin/` or `.coord/` existed
- Canonical DREP now installed at `system-devin/` with rep1=LEAD, rep2=ASSIST

## Canon context

- Authority role: `implementation`
- Canon contexts: `sigrank`
- Authority owner: `search_authority`

## Migration steps (before enforce)

1. [ ] Untrack secrets: `vercel-prod.env`, `.env.local` (public repo — highest priority)
2. [ ] Migrate `Devins_Plans/` coordination to `.coord/micro/` + `system-devin/`
3. [ ] Consider relocating `Devins_Plans/` to `archive/` after migration
4. [ ] Run `repo_check.py --ci` until clean
5. [ ] Switch REPO.yaml mode from `migrate` → `enforce`

## Enforce readiness

NOT READY — requires migration steps above (especially secret untracking).
