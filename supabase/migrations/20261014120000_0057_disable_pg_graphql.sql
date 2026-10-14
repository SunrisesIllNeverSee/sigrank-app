-- 0057_disable_pg_graphql.sql
-- Disable the pg_graphql auto-generated GraphQL API. Enabled opportunistically
-- in 0032 ("complements existing PostgREST") but the app never uses /graphql/v1 —
-- it is unused, attacker-reachable query surface over the entire public schema
-- (33 advisor findings: pg_graphql_*_table_exposed). PostgREST remains the only
-- API surface. Reversible: re-run 0032's CREATE EXTENSION if ever needed.

drop schema if exists graphql_public cascade;
drop extension if exists pg_graphql cascade;
