-- 0006_pg_trgm_schema.sql
-- Move pg_trgm out of the public schema → extensions (Supabase security advisor:
-- "Extension pg_trgm is installed in the public schema"). Applied to the live
-- Sigrank project 2026-06-19 via MCP; this file records it for repo parity.
--
-- The one dependent is the trigram index on operators.codename (fuzzy codename
-- search). Drop → move → recreate so the index rebuilds against the operator class
-- in its new home (no dangling gin_trgm_ops reference).

drop index if exists public.idx_operators_codename_trgm;

alter extension pg_trgm set schema extensions;

create index if not exists idx_operators_codename_trgm
  on public.operators using gin (codename extensions.gin_trgm_ops);
