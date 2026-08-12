-- 0031_refresh_system_stats.sql — refresh system_stats singleton + rank_history
-- backfill via pg_cron nightly job.
--
-- WHY:
--   system_stats was seeded once (0002/0018) with 707 operators and never updated.
--   The actual operator count is 1,687. The homepage reads this singleton and shows
--   stale numbers. rank_history has 1 row (MO§ES seed); the ingest pipeline never
--   writes to it. The app has a recomputeRank() fallback, but it's O(n) per page
--   load and doesn't persist.
--
-- This migration:
--   1. refresh_system_stats() — recomputes the singleton from live metric_snapshots
--      + operators. Runs nightly via pg_cron + on-demand via service_role.
--   2. backfill_rank_history() — computes global_rank + percentile for every
--      operator's latest 30d snapshot and upserts into rank_history. Runs nightly
--      after system_stats refresh.
--   3. Schedules both at 06:12 UTC (one minute after recompute-the-field).
--
-- Idempotent: re-running unschedules-then-reschedules and CREATE OR REPLACEs.
-- Security: service_role only (revoked from anon + authenticated), same pattern
-- as 0022.

-- ============================================================================
-- refresh_system_stats — recompute the singleton from live data
-- ============================================================================
create or replace function public.refresh_system_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_operators   integer;
  v_total_snapshots   bigint;
  v_total_tokens      bigint;
  v_transmitter_count integer;
  v_top_operator_id   uuid;
  v_top_signa_rate    numeric(5,2);
begin
  -- Total operators (exclude retired)
  select count(*) into v_total_operators
  from operators where status = 'active';

  -- Total snapshots
  select count(*) into v_total_snapshots from metric_snapshots;

  -- Total tokens scored (sum of input + output + cache_creation + cache_read)
  select coalesce(sum(
    coalesce(input_tokens, 0) +
    coalesce(output_tokens, 0) +
    coalesce(cache_creation_tokens, 0) +
    coalesce(cache_read_tokens, 0)
  ), 0) into v_total_tokens
  from metric_snapshots;

  -- Transmitter count (class_tier containing 'TRANSMITTER' or 'POWER' or 'ARCH')
  select count(distinct operator_id) into v_transmitter_count
  from metric_snapshots
  where class_tier ilike '%TRANSMITTER%'
     or class_tier ilike '%POWER%'
     or class_tier ilike '%ARCH%';

  -- Top operator by signa_rate (latest 30d snapshot, exclude seeds + The Field)
  select operator_id, signa_rate into v_top_operator_id, v_top_signa_rate
  from metric_snapshots
  where window_type = '30d'
    and operator_id not in (
      'f1e1d000-0000-4000-8000-000000000001'  -- The Field
    )
    and operator_id not in (
      select operator_id from operators
      where codename ilike 'static seed%' or codename ilike 'app seed%'
    )
  order by signa_rate desc nulls last
  limit 1;

  -- Upsert the singleton
  insert into system_stats (
    id, total_operators, total_snapshots, total_tokens_scored,
    transmitter_count, top_operator_id, top_signa_rate, updated_at
  )
  values (
    true, v_total_operators, v_total_snapshots, v_total_tokens,
    v_transmitter_count, v_top_operator_id, v_top_signa_rate, now()
  )
  on conflict (id) do update set
    total_operators     = excluded.total_operators,
    total_snapshots     = excluded.total_snapshots,
    total_tokens_scored = excluded.total_tokens_scored,
    transmitter_count   = excluded.transmitter_count,
    top_operator_id     = excluded.top_operator_id,
    top_signa_rate      = excluded.top_signa_rate,
    updated_at          = excluded.updated_at;
end;
$$;

-- ============================================================================
-- backfill_rank_history — compute global_rank + percentile for all operators
-- based on latest 30d snapshot, upsert into rank_history
-- ============================================================================
create or replace function public.backfill_rank_history()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete today's rows first (idempotent re-run)
  delete from rank_history where snapshot_date = current_date;

  -- Insert rank_history rows. Use DISTINCT ON to get only the latest 30d
  -- snapshot per operator (some operators have multiple 30d snapshots from
  -- re-submissions). Rank by yield (cache_read * output / input^2).
  -- Cast to numeric BEFORE multiplication to avoid bigint overflow.
  insert into rank_history (
    operator_id, snapshot_date, global_rank, percentile
  )
  with latest as (
    select distinct on (ms.operator_id)
      ms.operator_id,
      ms.input_tokens,
      ms.output_tokens,
      ms.cache_read_tokens
    from metric_snapshots ms
    where ms.window_type = '30d'
      and ms.operator_id not in (
        'f1e1d000-0000-4000-8000-000000000001'
      )
      and ms.operator_id not in (
        select operator_id from operators
        where codename ilike 'static seed%' or codename ilike 'app seed%'
      )
    order by ms.operator_id, ms.generated_at desc
  ),
  ranked as (
    select
      operator_id,
      row_number() over (order by
        case
          when input_tokens > 0 then
            (cache_read_tokens::numeric * output_tokens::numeric) /
            (input_tokens::numeric * input_tokens::numeric)
          else 0::numeric
        end desc
      ) as global_rank,
      count(*) over () as total_count
    from latest
  )
  select
    operator_id,
    current_date,
    global_rank,
    case when total_count > 1 then
      round(((total_count - global_rank)::numeric / (total_count - 1)) * 100, 2)
    else 100.00 end
  from ranked
  on conflict (operator_id, snapshot_date) do update set
    global_rank = excluded.global_rank,
    percentile  = excluded.percentile;
end;
$$;

-- ============================================================================
-- Revoke public execute (same pattern as 0022)
-- ============================================================================
revoke execute on function public.refresh_system_stats() from public, anon, authenticated;
revoke execute on function public.backfill_rank_history() from public, anon, authenticated;

-- ============================================================================
-- Schedule nightly via pg_cron (06:12 UTC, 1 min after recompute-the-field)
-- ============================================================================
do $$
begin
  perform cron.unschedule('refresh-system-stats')
  where exists (select 1 from cron.job where jobname = 'refresh-system-stats');
  perform cron.unschedule('backfill-rank-history')
  where exists (select 1 from cron.job where jobname = 'backfill-rank-history');
exception when others then
  null;
end $$;

select cron.schedule('refresh-system-stats', '12 6 * * *', $$select public.refresh_system_stats();$$);
select cron.schedule('backfill-rank-history', '13 6 * * *', $$select public.backfill_rank_history();$$);
