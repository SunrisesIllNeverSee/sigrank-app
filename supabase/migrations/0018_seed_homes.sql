-- !!! APPLIED MANUALLY via Supabase dashboard 2026-06-27 (DO-block paste). RECORD ONLY. !!!
-- !!! DO NOT run `supabase db push` — remote tracks migrations by TIMESTAMP but local are
-- !!! NUMBERED 0001-0020, so db push would try to RE-RUN ALL of them. Catastrophic.

-- ============================================================================
-- 0018_seed_homes.sql — give the OWNER "static seed" rows clean homes.
--
-- PROBLEM (board cleanup, 2026-06-27)
-- ----------------------------------------------------------------------------
-- The owner's own 730-pull demo data was loaded as EIGHT separate `operators`
-- rows — one per (window × variant) — instead of one operator per variant with
-- its windows modeled as per-window `metric_snapshots`:
--
--   operator_id                            codename                window_type
--   ────────────────────────────────────   ─────────────────────   ───────────
--   770cc504-57d6-479c-8a29-490b61b5a56a   static seed · 7d        7d        ┐
--   ef762ccf-21a8-4825-a3ee-90fc7ebbdf61   static seed · 30d       30d       │ CLEAN
--   3674c75b-df78-4c22-80a1-6443c0fbd67f   static seed · 90d       90d       │ (observer
--   6a6dea36-7c8d-421c-b60f-2a8316160ab9   static seed · all       all_time  ┘  stripped)
--   d8b18ec7-b564-47ca-a269-686895857187   static seed · 7d ✱mem   7d        ┐
--   73a0cba1-36b7-4c07-a240-8a101c433c24   static seed · 30d ✱mem  30d       │ ✱mem
--   d11c1856-fb1e-4582-a704-c1fc95d5e922   static seed · 90d ✱mem  90d       │ (claude-mem
--   b0058329-1c6c-4ca0-b21c-80aca42112f8   static seed · all ✱mem  all_time  ┘  inflated)
--
-- Because each is a distinct operator_id, the board's 1-row-per-operator collapse
-- (latestPerOperator, keyed on operator_id) CANNOT fold them — they fan out as 8
-- junk rows. Every PROPER operator on the board (MO§ES, the tokscale seeds) instead
-- carries MULTIPLE per-window snapshots under ONE operator_id and renders as a single
-- clean row. These 8 are the lone exception.
--
-- FIX
-- ----------------------------------------------------------------------------
-- Consolidate the 8 per-window operators into TWO proper seed "homes", one per
-- variant, each holding its four per-window metric_snapshots (7d/30d/90d/all_time):
--
--   KEEP 770cc504… → rename to the CLEAN home   (codename 'static-seed-clean')
--   KEEP d8b18ec7… → rename to the ✱mem  home   (codename 'static-seed-mem')
--
-- We re-point the 30d/90d/all_time snapshots of each variant onto its kept home,
-- re-point every other operator-FK child row defensively, then delete the 6
-- now-empty per-window operators. After this runs the board's existing
-- latestPerOperator collapse folds each home to a single clean row, and the profile
-- Submissions grid (getOperatorSubmissions) shows all four windows under one home —
-- exactly like every other seed.
--
-- SAFETY (see the self-assessment in the handoff for the full risk write-up)
-- ----------------------------------------------------------------------------
--  * Transactional: BEGIN/COMMIT — all-or-nothing.
--  * Idempotent: every step is a no-op on a second run (the 6 source ids are gone,
--    the kept rows are already renamed, the snapshots already re-pointed).
--  * Surgical: every statement is keyed on the EIGHT hardcoded seed UUIDs above and
--    NOTHING else. No `WHERE codename LIKE '%seed%'`, no platform/date predicate that
--    could sweep a real operator. A real operator id is never in any IN(...) list.
--  * No data loss for real operators: only the 6 redundant SEED operators are deleted,
--    and only AFTER their snapshots (the only payload these seeds carry) are re-pointed
--    onto a kept home. The kept rows + their snapshots survive in full.
--  * FK-complete: before deleting, we re-point/clean EVERY table that FKs
--    operators(operator_id) for the 6 doomed ids (metric_snapshots, rank_history,
--    plus a defensive sweep of the rest), so the DELETE cannot raise an FK violation
--    and cannot orphan a child row.
--
-- ROLLBACK NOTE
-- ----------------------------------------------------------------------------
-- This migration is destructive (it DELETEs 6 operators) and is NOT auto-reversible.
-- The deleted rows are pure demo seeds (the owner's own 730 pulls; claimed=false,
-- unverified, no devices/payments/accounts), and their numeric payload is fully
-- preserved (it is re-pointed onto the two kept homes — nothing is dropped). If the
-- owner needs the old 8-row shape back, re-seed from lib/data/mock.ts SEED_CORPUS
-- (the 8 `static seed · …` specs) which still carries the original pillars verbatim.
-- Take a Supabase backup / point-in-time snapshot before applying (see apply_steps).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Pre-flight guard — only run the body if the OLD 8-row shape is still present.
--    If a prior run (or manual cleanup) already collapsed them, every step below
--    is already a no-op, but this NOTICE makes a re-run self-documenting.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  n_seed_ops integer;
BEGIN
  SELECT count(*) INTO n_seed_ops
  FROM operators
  WHERE operator_id IN (
    '770cc504-57d6-479c-8a29-490b61b5a56a',  -- clean · 7d   (KEEP → clean home)
    'ef762ccf-21a8-4825-a3ee-90fc7ebbdf61',  -- clean · 30d
    '3674c75b-df78-4c22-80a1-6443c0fbd67f',  -- clean · 90d
    '6a6dea36-7c8d-421c-b60f-2a8316160ab9',  -- clean · all
    'd8b18ec7-b564-47ca-a269-686895857187',  -- ✱mem · 7d    (KEEP → mem home)
    '73a0cba1-36b7-4c07-a240-8a101c433c24',  -- ✱mem · 30d
    'd11c1856-fb1e-4582-a704-c1fc95d5e922',  -- ✱mem · 90d
    'b0058329-1c6c-4ca0-b21c-80aca42112f8'   -- ✱mem · all
  );
  RAISE NOTICE '0018_seed_homes: % of the 8 legacy static-seed operators present (8=fresh apply, 0=already consolidated).', n_seed_ops;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Re-point the variant's 30d/90d/all_time snapshots onto the kept HOME.
--    Each home already owns its 7d snapshot; we move the other three windows from
--    the three doomed siblings onto it. window_type stays untouched, so the kept
--    home ends with one snapshot per (7d,30d,90d,all_time) — the UNIQUE
--    (operator_id, snapshot_date, window_type, platform) [widened by migration 0015]
--    holds (4 distinct window_types, same date). The NOT EXISTS guard below omits
--    platform, so it is strictly MORE conservative than the real 4-col key.
--
--    Guarded by NOT EXISTS so a re-run (where the move already happened) is a no-op
--    AND so we never collide with a snapshot the home might already hold for that
--    window (defensive — there is none today, but this keeps the UNIQUE safe).
-- ----------------------------------------------------------------------------

-- CLEAN home ← clean 30d / 90d / all_time
UPDATE metric_snapshots m
   SET operator_id = '770cc504-57d6-479c-8a29-490b61b5a56a'
 WHERE m.operator_id IN (
         'ef762ccf-21a8-4825-a3ee-90fc7ebbdf61',  -- clean · 30d
         '3674c75b-df78-4c22-80a1-6443c0fbd67f',  -- clean · 90d
         '6a6dea36-7c8d-421c-b60f-2a8316160ab9'   -- clean · all
       )
   AND NOT EXISTS (
         SELECT 1 FROM metric_snapshots h
          WHERE h.operator_id  = '770cc504-57d6-479c-8a29-490b61b5a56a'
            AND h.snapshot_date = m.snapshot_date
            AND h.window_type   = m.window_type
       );

-- ✱mem home ← mem 30d / 90d / all_time
UPDATE metric_snapshots m
   SET operator_id = 'd8b18ec7-b564-47ca-a269-686895857187'
 WHERE m.operator_id IN (
         '73a0cba1-36b7-4c07-a240-8a101c433c24',  -- ✱mem · 30d
         'd11c1856-fb1e-4582-a704-c1fc95d5e922',  -- ✱mem · 90d
         'b0058329-1c6c-4ca0-b21c-80aca42112f8'   -- ✱mem · all
       )
   AND NOT EXISTS (
         SELECT 1 FROM metric_snapshots h
          WHERE h.operator_id  = 'd8b18ec7-b564-47ca-a269-686895857187'
            AND h.snapshot_date = m.snapshot_date
            AND h.window_type   = m.window_type
       );

-- ----------------------------------------------------------------------------
-- 2. Rename the two KEPT operators into clean, human-readable homes.
--    codename     = the /user/<codename> profile-route key (must be URL-safe + unique).
--    display_name = what the board renders (anonId = display_name ?? codename).
--    Both kept rows already have account_age_days/total_messages_lifetime from their
--    7d snapshot; bump them to the all_time figures so the home reads as the operator's
--    lifetime totals (matches the all_time snapshot now living under it).
-- ----------------------------------------------------------------------------
UPDATE operators
   SET codename                = 'static-seed-clean',
       display_name            = 'static seed · clean',
       account_age_days        = 119,     -- all_time age (was 30 from the 7d row)
       total_messages_lifetime = 12135    -- all_time lifetime (clean variant)
 WHERE operator_id = '770cc504-57d6-479c-8a29-490b61b5a56a'
   AND codename = 'static seed · 7d';      -- guard: only rename the un-renamed row

UPDATE operators
   SET codename                = 'static-seed-mem',
       display_name            = 'static seed · ✱mem',
       account_age_days        = 119,     -- all_time age
       total_messages_lifetime = 15599    -- all_time lifetime (✱mem variant)
 WHERE operator_id = 'd8b18ec7-b564-47ca-a269-686895857187'
   AND codename = 'static seed · 7d ✱mem';

-- ----------------------------------------------------------------------------
-- 3. Defensive FK cleanup for the SIX doomed operators.
--    These are pure demo seeds (claimed=false, unverified) so in practice the only
--    child rows they ever had are metric_snapshots (already moved in step 1) and
--    possibly rank_history (per-operator manual seed inserts). We nonetheless clean
--    EVERY table that FKs operators(operator_id) for the doomed ids, so the DELETE in
--    step 4 can never raise an FK violation regardless of what got attached in prod.
--
--    Tables that REFERENCE operators(operator_id):
--      metric_snapshots(operator_id)        — re-pointed in step 1
--      rank_history(operator_id)            — delete (per-window seed rank, meaningless)
--      operator_badges(operator_id)         — delete (no awards on seeds)
--      audit_records(operator_id)           — delete (0001 forensic trail)
--      audit_log(operator_id)               — delete (0002 state-change trail; nullable FK)
--      snapshot_submissions(operator_id)    — delete (no raw submissions on static seeds)
--      session_summaries(operator_id)       — delete
--      feature_rollups_daily(operator_id)   — delete
--      devices(operator_id)                 — delete (seeds never enrolled a device)
--      device_enroll_codes(operator_id)     — delete
--      subscriptions(operator_id)           — delete (no billing on free seeds)
--      operator_rewards(operator_id)        — delete
--      challenges(challenger/challenged/winner_id) — delete any referencing a doomed id
--      challenge_submissions(operator_id)   — delete
--      operator_accounts(operator_id)       — ON DELETE CASCADE (auth) — auto-removed,
--                                             but we delete explicitly for clarity
--      system_stats.top_operator_id         — nullable; null it out if it points at one
--    (circles / circle_members were dropped 2026-06-25 — those tables no longer exist.)
--
--    The doomed-id list is the SIX siblings only — the two KEPT homes are NOT in it.
-- ----------------------------------------------------------------------------

-- Single source of truth for the doomed ids, via a temp view-free CTE pattern:
-- each DELETE re-lists them so the statement is self-contained + idempotent.
-- (Re-running after the operators are gone simply deletes zero rows.)

DELETE FROM rank_history          WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM operator_badges       WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM audit_records         WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM audit_log             WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM snapshot_submissions  WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM session_summaries     WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM feature_rollups_daily WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM device_enroll_codes   WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM devices               WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM subscriptions         WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM operator_rewards      WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM challenge_submissions WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM challenges            WHERE challenger_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8')
                                     OR challenged_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8')
                                     OR winner_id     IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
DELETE FROM operator_accounts     WHERE operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');

-- system_stats.top_operator_id is nullable + points at the #1 operator. A static seed
-- is never #1 (MO§ES/the tokscale ops outrank them), but null it defensively if it
-- somehow points at a doomed id, so the FK can't block the DELETE.
UPDATE system_stats
   SET top_operator_id = NULL
 WHERE top_operator_id IN ('ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f','6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24','d11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');

-- ----------------------------------------------------------------------------
-- 4. Delete the six now-empty per-window seed operators.
--    Their snapshots are re-pointed (step 1) and every other FK child is cleaned
--    (step 3), so this cannot raise an FK violation. The two KEPT homes are not in
--    this list. Re-running after the rows are gone deletes zero rows (idempotent).
--    Belt-and-braces: the `claimed = false` predicate guarantees we never delete a
--    claimed/real operator even if one of these UUIDs were ever (mistakenly) reused.
-- ----------------------------------------------------------------------------
DELETE FROM operators
 WHERE operator_id IN (
         'ef762ccf-21a8-4825-a3ee-90fc7ebbdf61',  -- clean · 30d
         '3674c75b-df78-4c22-80a1-6443c0fbd67f',  -- clean · 90d
         '6a6dea36-7c8d-421c-b60f-2a8316160ab9',  -- clean · all
         '73a0cba1-36b7-4c07-a240-8a101c433c24',  -- ✱mem · 30d
         'd11c1856-fb1e-4582-a704-c1fc95d5e922',  -- ✱mem · 90d
         'b0058329-1c6c-4ca0-b21c-80aca42112f8'   -- ✱mem · all
       )
   AND claimed = false;

-- ----------------------------------------------------------------------------
-- 5. Post-flight assertion — leave the DB in the expected shape or roll back.
--    Expected after a fresh apply:
--      * 0 of the 6 doomed operators remain.
--      * 2 kept homes exist (static-seed-clean / static-seed-mem).
--      * each kept home owns exactly its set of windows (clean: 4, mem: 4).
--    On a re-run these all still hold (the homes already exist), so the assert
--    passes both on first apply and on replay.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  n_doomed   integer;
  n_clean_w  integer;
  n_mem_w    integer;
BEGIN
  SELECT count(*) INTO n_doomed FROM operators
   WHERE operator_id IN (
     'ef762ccf-21a8-4825-a3ee-90fc7ebbdf61','3674c75b-df78-4c22-80a1-6443c0fbd67f',
     '6a6dea36-7c8d-421c-b60f-2a8316160ab9','73a0cba1-36b7-4c07-a240-8a101c433c24',
     'd11c1856-fb1e-4582-a704-c1fc95d5e922','b0058329-1c6c-4ca0-b21c-80aca42112f8');
  IF n_doomed <> 0 THEN
    RAISE EXCEPTION '0018_seed_homes: % doomed seed operators still present after delete — rolling back.', n_doomed;
  END IF;

  SELECT count(*) INTO n_clean_w FROM metric_snapshots
   WHERE operator_id = '770cc504-57d6-479c-8a29-490b61b5a56a';
  SELECT count(*) INTO n_mem_w FROM metric_snapshots
   WHERE operator_id = 'd8b18ec7-b564-47ca-a269-686895857187';
  RAISE NOTICE '0018_seed_homes: clean home holds % window snapshots, mem home holds % (4 each expected).', n_clean_w, n_mem_w;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION (run by the snapshot job, NOT this migration):
--   node scripts/snapshot-db.mjs   → refresh lib/data/snapshot.json so the cold-store
--   fallback matches the new 2-home shape. (snapshot.json is the fallback only; the
--   live board already reads the new shape the instant this migration commits.)
-- ============================================================================
