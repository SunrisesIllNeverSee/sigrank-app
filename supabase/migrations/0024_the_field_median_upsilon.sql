-- 0024_the_field_median_upsilon.sql — fix The Field's Jensen's inequality bug.
--
-- The Field (operator_id = 'f1e1d000-0000-4000-8000-000000000001') is the
-- "average operator" baseline. 0019 computed it by averaging the four raw
-- pillars (input/output/cache_creation/cache_read) then letting downstream
-- recompute Υ from those averaged pillars. Because Υ = cache_read × output /
-- input² is nonlinear, Υ(mean pillars) ≠ mean(Υ) (Jensen's inequality). On a
-- right-skewed field (one operator can be ~64% of total tokens) this made
-- The Field track the biggest operator, not the typical one.
--
-- This migration replaces the mean-of-pillars approach with a median-of-Υ
-- approach: compute each real operator's Υ first, then store the MEDIAN Υ
-- as The Field's yield. The pillars are set to the median operator's actual
-- pillars (the operator whose Υ is the median), so the board's recompute-on-
-- read contract is preserved (Υ is always derived from the 4 pillars).
--
-- The signa_rate is also set to the median operator's signa_rate.
--
-- Append-only: does not edit 0019 in place. CREATE OR REPLACEs the function.
-- Idempotent: re-running unschedules-then-reschedules and CREATE OR REPLACEs.

create or replace function public.recompute_the_field()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field uuid := 'f1e1d000-0000-4000-8000-000000000001';
  v_in    numeric;
  v_out   numeric;
  v_cc    numeric;
  v_cr    numeric;
  v_signa numeric;
  v_ups   numeric;
begin
  -- Median Υ approach: find the operator whose Υ is the median, then use
  -- THEIR actual pillars (so recompute-on-read gives the median Υ, not a
  -- ratio-of-means construct). This matches the "median, not mean" honesty
  -- already stated in ThreeDegreesChart.tsx.
  --
  -- Υ = cache_read × output / input² (the rank metric).
  -- We use percentile_cont(0.5) to find the median Υ, then pick the
  -- operator whose computed Υ is closest to that median.
  with real_ops as (
    select
      ms.input_tokens,
      ms.output_tokens,
      ms.cache_creation_tokens,
      ms.cache_read_tokens,
      ms.signa_rate,
      -- Υ = cache_read × output / input² (guard against zero input)
      case
        when ms.input_tokens > 0
        then ms.cache_read_tokens * ms.output_tokens / (ms.input_tokens ^ 2)
        else 0
      end as upsilon
    from metric_snapshots ms
    join operators o on o.operator_id = ms.operator_id
    where ms.window_type = '30d'
      and o.operator_id <> v_field
      and o.codename not ilike 'static seed%'
      and o.codename not ilike 'app seed%'
      and ms.input_tokens > 0
  ),
  median_yield as (
    select percentile_cont(0.5) within group (order by upsilon) as med
    from real_ops
  )
  select
    ro.input_tokens,
    ro.output_tokens,
    ro.cache_creation_tokens,
    ro.cache_read_tokens,
    ro.signa_rate,
    ro.upsilon
  into v_in, v_out, v_cc, v_cr, v_signa, v_ups
  from real_ops ro, median_yield m
  order by abs(ro.upsilon - m.med) asc
  limit 1;

  -- Nothing to average (no real operators yet) → leave The Field untouched.
  if v_in is null then
    return;
  end if;

  update metric_snapshots
  set input_tokens          = v_in,
      output_tokens         = v_out,
      cache_creation_tokens = v_cc,
      cache_read_tokens     = v_cr,
      signa_rate            = v_signa,
      snapshot_date         = current_date,
      generated_at          = now()
  where operator_id = v_field and window_type = '30d';
end;
$$;

-- (Re)schedule nightly. Unschedule first so re-running the migration is safe.
do $$
begin
  perform cron.unschedule('recompute-the-field')
  where exists (select 1 from cron.job where jobname = 'recompute-the-field');
exception when others then
  null; -- no prior job
end $$;

select cron.schedule('recompute-the-field', '11 6 * * *', $$select public.recompute_the_field();$$);
