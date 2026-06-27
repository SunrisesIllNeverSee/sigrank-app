-- 0019_the_field_autoupdate.sql — keep "The Field" (the average/baseline operator)
-- current via a nightly pg_cron recompute (owner 2026-06-27).
--
-- The Field is a real board operator whose 30d pillars are the MEAN of the real
-- operators. Inserted once in 2026-06-27; without this it never updates. This
-- migration:
--   1. enables pg_cron,
--   2. defines recompute_the_field() — re-averages the real 30d operators and
--      UPDATEs The Field's snapshot, EXCLUDING the staged seeds and The Field
--      itself (else it averages itself and drifts),
--   3. schedules it nightly at 06:11 UTC.
--
-- Idempotent: re-running unschedules-then-reschedules and CREATE OR REPLACEs.

create extension if not exists pg_cron;

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
begin
  -- Mean of the REAL operators' 30d pillars. Exclude the staged seeds
  -- (codename like 'static seed%' / 'app seed%') and The Field itself.
  select
    round(avg(ms.input_tokens)),
    round(avg(ms.output_tokens)),
    round(avg(ms.cache_creation_tokens)),
    round(avg(ms.cache_read_tokens)),
    round(avg(ms.signa_rate), 1)
  into v_in, v_out, v_cc, v_cr, v_signa
  from metric_snapshots ms
  join operators o on o.operator_id = ms.operator_id
  where ms.window_type = '30d'
    and o.operator_id <> v_field
    and o.codename not ilike 'static seed%'
    and o.codename not ilike 'app seed%';

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
