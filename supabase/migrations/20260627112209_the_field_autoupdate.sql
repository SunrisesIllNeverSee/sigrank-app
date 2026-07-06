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

do $$
begin
  perform cron.unschedule('recompute-the-field')
  where exists (select 1 from cron.job where jobname = 'recompute-the-field');
exception when others then
  null;
end $$;

select cron.schedule('recompute-the-field', '11 6 * * *', $$select public.recompute_the_field();$$);;
