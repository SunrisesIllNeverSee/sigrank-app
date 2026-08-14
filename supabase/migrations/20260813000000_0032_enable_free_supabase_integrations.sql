-- 0032_enable_free_supabase_integrations.sql
-- Enable free Supabase platform integrations: pgvector, pg_graphql, pg_net, Realtime.
-- All included in the Free plan quota — no additional cost.
--
-- pgvector:    vector data type + ivfflat/hnsw indexes for semantic operator matching
-- pg_graphql:  auto-generated GraphQL API (complements existing PostgREST)
-- pg_net:      async HTTP client from inside Postgres (webhooks, external API calls)
-- Realtime:    live updates on metric_snapshots, leaderboards_cached, operators
--              (200 concurrent connections, 2M messages/mo on Free plan)

-- Extensions (idempotent — safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_graphql;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Realtime: add key tables to the supabase_realtime publication
-- These are the tables where live updates matter most for the leaderboard UX:
--   metric_snapshots    → new snapshot submitted → board refresh
--   leaderboards_cached → rank recomputed → board refresh
--   operators           → profile/class change → profile refresh
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.metric_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.leaderboards_cached;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.operators;
