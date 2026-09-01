-- 0047_compute_rank_movement.sql — compute movement_24h / movement_7d from
-- rank_history deltas and write them to metric_snapshots.
--
-- WHY:
--   movement_24h and movement_7d are columns on metric_snapshots but nothing
--   ever computes them. They're always 0. The sigeconomy.com /weekly page
--   (and the signalaf.com board "movers" sections) read these fields to show
--   biggest movers, new challengers, and rank shifts — but they're permanently
--   empty because no job populates them.
--
--   rank_history IS populated nightly by backfill_rank_history() (step 3 of
--   the daily recompute workflow). It stores global_rank per operator per day.
--   This migration adds a function that reads the delta between today's rank
--   and the rank 1 / 7 days ago, then updates the latest metric_snapshots rows.
--
-- WHAT:
--   compute_rank_movement() — for each operator's latest snapshot per window:
--     1. Look up today's global_rank in rank_history
--     2. Look up global_rank from 1 day ago → movement_24h = prev_rank - today_rank
--        (positive = climbed, negative = dropped)
--     3. Look up global_rank from 7 days ago → movement_7d = prev_rank - today_rank
--     4. UPDATE metric_snapshots SET movement_24h, movement_7d
--
--   Runs nightly after backfill_rank_history (step 4 of the daily recompute).
--
-- Idempotent: re-running recomputes all movements from rank_history.
-- Security: service_role only (revoked from anon + authenticated).

-- ============================================================================
-- compute_rank_movement — compute movement_24h / movement_7d from rank_history
-- and update the latest metric_snapshots rows for each operator.
-- ============================================================================
create or replace function public.compute_rank_movement()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_7d_ago date := current_date - 7;
begin
  -- Build a CTE that joins today's rank with historical ranks, computes deltas,
  -- then updates the latest metric_snapshots row per operator.
  --
  -- movement_24h = rank_yesterday - rank_today  (positive = climbed)
  -- movement_7d  = rank_7d_ago   - rank_today   (positive = climbed)
  --
  -- We update ALL window types for each operator's latest snapshot, since the
  -- board shows movement on every window (7d, 30d, 90d, all_time). The rank
  -- delta is the same across windows (it's a global rank shift), but each
  -- window's latest snapshot row gets the values so the board query reads them
  -- without a join.

  with today_ranks as (
    select operator_id, global_rank as rank_today
    from rank_history
    where snapshot_date = v_today
  ),
  yesterday_ranks as (
    select operator_id, global_rank as rank_yesterday
    from rank_history
    where snapshot_date = v_yesterday
  ),
  week_ago_ranks as (
    select operator_id, global_rank as rank_7d_ago
    from rank_history
    where snapshot_date = v_7d_ago
  ),
  movements as (
    select
      t.operator_id,
      coalesce(y.rank_yesterday - t.rank_today, 0) as movement_24h,
      coalesce(w.rank_7d_ago - t.rank_today, 0) as movement_7d
    from today_ranks t
    left join yesterday_ranks y on t.operator_id = y.operator_id
    left join week_ago_ranks w on t.operator_id = w.operator_id
  ),
  -- Find the latest snapshot_id per (operator_id, window_type) so we update
  -- only the most recent row — not every historical snapshot.
  latest_snapshots as (
    select distinct on (operator_id, window_type)
      metric_snapshot_id,
      operator_id,
      window_type
    from metric_snapshots
    where operator_id in (select operator_id from movements)
    order by operator_id, window_type, generated_at desc
  )
  update metric_snapshots ms
  set
    movement_24h = m.movement_24h,
    movement_7d  = m.movement_7d
  from movements m
  join latest_snapshots ls
    on m.operator_id = ls.operator_id
  where ms.metric_snapshot_id = ls.metric_snapshot_id;
end;
$$;

-- ============================================================================
-- Revoke public execute (same pattern as 0031/0035)
-- ============================================================================
revoke execute on function public.compute_rank_movement() from public, anon, authenticated;
