-- 0021_site_counters.sql
-- Site-wide event counters for the homepage live-activity strip (P2-1 "full wire").
-- First counter: comparisons_ran — bumped when a user runs a specific /compare
-- matchup. Read by getHomepageStats(); surfaced (still fogged) in Draft2LiveActivity.
--
-- 🔴 APPLY VIA the Supabase dashboard SQL editor OR the Supabase MCP apply_migration.
--    NEVER `supabase db push` — the remote ledger is timestamp-based and a push
--    re-runs ALL numbered migrations (0001–00xx) = catastrophic. (See 0018 header.)

create table if not exists site_counters (
  key        text primary key,
  value      bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into site_counters (key, value)
values ('comparisons_ran', 0)
on conflict (key) do nothing;

-- RLS: public SELECT (it's a non-PII vanity counter, mirrors system_stats), but NO
-- anon write policy — the increment runs through the server (service-role) client +
-- the server-only RPC below. Direct anon writes/calls stay blocked.
alter table site_counters enable row level security;

drop policy if exists p_site_counters_public_select on site_counters;
create policy p_site_counters_public_select on site_counters
  for select to anon, authenticated using (true);

-- Atomic increment (supabase-js can't express value = value + 1 directly). SECURITY
-- INVOKER — the only caller is the server's service_role client (which already bypasses
-- RLS), so no DEFINER is needed. Execute is REVOKED from PUBLIC so anon/authenticated
-- can't call it as a public endpoint (Postgres grants EXECUTE to PUBLIC by default).
create or replace function increment_site_counter(counter_key text)
returns void
language sql
security invoker
set search_path = public
as $$
  update site_counters set value = value + 1, updated_at = now() where key = counter_key;
$$;

-- Revoke from public AND anon/authenticated explicitly — Supabase's ALTER DEFAULT
-- PRIVILEGES grants EXECUTE to anon+authenticated directly on new public functions,
-- so a `from public` revoke alone leaves them able to call it.
revoke execute on function increment_site_counter(text) from public, anon, authenticated;
grant execute on function increment_site_counter(text) to service_role;
