#!/usr/bin/env bash
# Local-only harness (never touches hosted Supabase). Needs Postgres binaries on PATH,
# e.g. PATH=/opt/homebrew/opt/postgresql@16/bin:$PATH. Usage: supabase/tests/run_security_tests.sh
# Runs the 0053 stack, then 0054 twice, as superuser and again as a non-superuser owner.
set -euo pipefail
export PATH="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}:$PATH"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; PORT="${PGPORT_TEST:-55432}"
trap 'pg_ctl -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
initdb -D "$D/data" -U postgres -A trust >/dev/null
pg_ctl -D "$D/data" -o "-p $PORT -k $D" -l "$D/log" -w start >/dev/null
M="$ROOT/supabase/migrations"; T="$ROOT/supabase/tests"
A=(-q -v ON_ERROR_STOP=1 -h "$D" -p "$PORT")
psql "${A[@]}" -U postgres -c "create role anon nologin" -c "create role authenticated nologin" -c "create role service_role nologin bypassrls"
for mode in superuser nonsuper; do
  DB="t_$mode"
  USR=postgres
  psql "${A[@]}" -U postgres -c "create database $DB"
  if [ "$mode" = nonsuper ]; then
    # 0053 creates a cluster-global role; reset it so the non-superuser creates it itself
    psql "${A[@]}" -U postgres -c "drop database t_superuser" -c "drop role signalaf_public_projection"
    psql "${A[@]}" -U postgres -c "create role app_owner login createrole nosuperuser" -c "alter database $DB owner to app_owner" -c "grant anon, authenticated, service_role to app_owner"
    psql "${A[@]}" -U postgres -d "$DB" -c "alter schema public owner to app_owner"
    USR=app_owner
  fi
  q() { psql "${A[@]}" -U "$USR" -d "$DB" "$@"; }
  echo "== $mode =="
  # roles are shared cluster objects: strip the bootstrap's CREATE ROLE line
  sed -E '1d' "$T/operator_security_bootstrap.sql" | q -f -
  q -f "$M/20261013165225_0053_operator_security_boundaries.sql"
  q -f "$T/security_pass2_bootstrap.sql"
  q -f "$M/20261013200000_0054_security_hardening_pass2.sql"
  q -f "$T/operator_security_verify.sql" -f "$T/security_pass2_verify.sql"
  echo "-- re-run 0054 (idempotency)"
  q -f "$M/20261013200000_0054_security_hardening_pass2.sql"
  q -f "$T/security_pass2_verify.sql"
done
echo ALL-OK
