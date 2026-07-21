# sigrank-app Restructure Checklist

Use this checklist to verify every phase of the observatory-spine restructure in `sigrank-app`.

## Phase 0 — Pre-flight

- [ ] Branch exists: `restructure/observatory-spine`
- [ ] `git status` is clean before starting each phase
- [ ] `npx tsc --noEmit` passes before any changes
- [ ] `npm run test:canonical` passes (11/11, MOSES Υ 18436.98)

## Phase 1 — Write the observatory spine

- [ ] Directory `observatory/` exists with:
  - [ ] `README.md`
  - [ ] `principles.md`
  - [ ] `architecture.md`
  - [ ] `roadmap.md`
- [ ] Directory `ontology/` exists with:
  - [ ] `README.md`
  - [ ] `operator.md`
  - [ ] `submission.md`
  - [ ] `telemetry.md`
  - [ ] `cascade.md`
  - [ ] `metrics.md`
  - [ ] `signals.md`
  - [ ] `field.md`
  - [ ] `atlas.md` (placeholder OK)
  - [ ] `taxonomy.md`
- [ ] Directory `methodology/` exists with:
  - [ ] `README.md`
  - [ ] `cascade-model.md`
  - [ ] `metric-definitions.md`
  - [ ] `field-statistics.md`
  - [ ] `bot-detection.md`
  - [ ] `normalization.md`
  - [ ] `limitations.md`
- [ ] Directory `governance/` exists with:
  - [ ] `README.md`
  - [ ] `DATA_POLICY.md`
  - [ ] `CONSENT_MODEL.md`
  - [ ] `OPT_OUT_POLICY.md`
  - [ ] `REMOVAL_POLICY.md`
  - [ ] `CLAIM_POLICY.md`
  - [ ] `PROVENANCE.md`
  - [ ] `ETHICS.md`
  - [ ] `DATA_RETENTION.md`
- [ ] Placeholder directories exist: `datasets/`, `research/`, `papers/`
- [ ] `npx tsc --noEmit` still passes (no code changes)

## Phase 2 — Consent tracking migration

- [ ] `supabase/migrations/0029_consent_tracking.sql` exists
- [ ] Columns added to `operators`:
  - [ ] `consented_at TIMESTAMPTZ`
  - [ ] `terms_version TEXT`
  - [ ] `privacy_version TEXT`
  - [ ] `data_opt_out BOOLEAN NOT NULL DEFAULT FALSE`
  - [ ] `data_opt_out_at TIMESTAMPTZ`
- [ ] Comments added to columns explaining purpose
- [ ] No code reads/writes the columns yet
- [ ] `npx tsc --noEmit` still passes

## Phase 3 — Restructure `lib/`

- [ ] New directories exist: `lib/analytics`, `lib/board`, `lib/infra/supabase`, `lib/infra/stripe`, `lib/infra/posthog`, `lib/infra/audit`, `lib/identity`
- [ ] Files moved per `RESTRUCTURE_BLUEPRINT.md` mapping
- [ ] Old empty directories removed
- [ ] All `import` paths updated
- [ ] `npx tsc --noEmit` passes with **0 errors**
- [ ] `npm test` passes
- [ ] `npm run test:canonical` passes (11/11, MOSES Υ 18436.98)
- [ ] No file CONTENT changed during the move — only paths

## Phase 4 — (MCP only; verify after Phase 4 in `sigrank-mcp`)

- [ ] `sigrank-mcp` restructure completed
- [ ] `sigrank-mcp/scripts/sync-spine.mjs` copies docs from `sigrank-app` successfully
- [ ] `node scripts/sync-spine.mjs --check` in `sigrank-mcp` passes

## Phase 5 — Wire consent + deletion into app

- [ ] `lib/ingest/gates.ts` checks `data_opt_out` and rejects submissions when true
- [ ] `lib/infra/api-auth.ts` records consent on enrollment
- [ ] `app/api/v1/devices/enroll/route.ts` accepts and stores consent payload
- [ ] `app/api/v1/snapshots/route.ts` rejects opt-out operators
- [ ] `app/settings/page.tsx` exposes opt-out / data-deletion controls
- [ ] New component `components/settings/DataDeletion.tsx` exists
- [ ] New route `app/api/v1/account/delete-data/route.ts` exists
- [ ] New RPC `clear_operator_data()` in Supabase deletes history, revokes devices, sets `data_opt_out`
- [ ] Existing `app/api/v1/account/delete/route.ts` still works (full account deletion)
- [ ] `app/privacy/page.tsx` links to governance docs and explains deletion options
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` passes
- [ ] `npm run test:canonical` passes

## Phase 7 — Final verification

- [ ] `npx tsc --noEmit`
- [ ] `npm run test:canonical`
- [ ] `npm test`
- [ ] `npm run test:ui` (if UI changed)
- [ ] `npm run build` (or CI build)
- [ ] `node ../sigrank-mcp/scripts/sync-spine.mjs --check` passes (spine in sync)
- [ ] All checklist items above are checked
- [ ] Commit with clear message: `refactor: restructure lib/ into observatory domain layers`
