-- 0048_refresh_system_stats_yield.sql
-- Fix refresh_system_stats() to track top Yield (Υ) instead of signa_rate.
--
-- The original refresh_system_stats() (migration 0031) picked the top operator
-- by signa_rate (a 0-100 signal metric) and stored it in top_signa_rate. The
-- homepage and llms.txt labeled this as "Top Yield" — but signa_rate is NOT
-- Yield (Υ = cache_read × output / input²). Yield ranges into millions;
-- signa_rate is capped at ~100. This caused Brave Search to report
-- "Top Yield: 88 (OrcaVanguard)" when the real top Yield is 6,884,512 (H82).
--
-- This migration:
-- 1. Adds top_yield DOUBLE PRECISION column to system_stats.
-- 2. Rewrites refresh_system_stats() to pick the top operator by yield_
--    (from the latest 30d snapshot, excluding seeds + The Field).
-- 3. Preserves top_signa_rate for backward compatibility (still populated,
--    just no longer the "top" selector).
-- 4. Backfills top_yield from the current best 30d snapshot.
-- ============================================================================

-- Step 1: Add top_yield column
alter table system_stats add column if not exists top_yield double precision;

-- Step 2: Rewrite refresh_system_stats() to select by yield_
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
  v_top_yield         double precision;
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

  -- Top operator by Yield (Υ) — latest 30d snapshot per operator,
  -- excluding seeds + The Field. Yield_ is the canonical efficiency metric.
  -- Use DISTINCT ON to get one row per operator (the latest 30d snapshot).
  select operator_id, yield_, signa_rate
    into v_top_operator_id, v_top_yield, v_top_signa_rate
  from (
    select distinct on (operator_id)
      operator_id, yield_, signa_rate
    from metric_snapshots
    where window_type = '30d'
      and operator_id not in (
        'f1e1d000-0000-4000-8000-000000000001'  -- The Field
      )
      and operator_id not in (
        select operator_id from operators
        where codename ilike 'static seed%' or codename ilike 'app seed%'
      )
      and yield_ is not null and yield_ > 0
    order by operator_id, generated_at desc
  ) latest
  order by yield_ desc
  limit 1;

  -- Upsert the singleton
  insert into system_stats (
    id, total_operators, total_snapshots, total_tokens_scored,
    transmitter_count, top_operator_id, top_signa_rate, top_yield, updated_at
  )
  values (
    true, v_total_operators, v_total_snapshots, v_total_tokens,
    v_transmitter_count, v_top_operator_id, v_top_signa_rate, v_top_yield, now()
  )
  on conflict (id) do update set
    total_operators     = excluded.total_operators,
    total_snapshots     = excluded.total_snapshots,
    total_tokens_scored = excluded.total_tokens_scored,
    transmitter_count   = excluded.transmitter_count,
    top_operator_id     = excluded.top_operator_id,
    top_signa_rate      = excluded.top_signa_rate,
    top_yield           = excluded.top_yield,
    updated_at          = excluded.updated_at;
end;
$$;

-- Step 3: Revoke execution from public roles (security definer function)
revoke execute on function public.refresh_system_stats() from public, anon, authenticated;

-- Step 4: Backfill top_yield immediately
select public.refresh_system_stats();
