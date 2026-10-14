#!/usr/bin/env bash
set -euo pipefail
export PATH="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}:$PATH"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; PORT="${PGPORT_TEST:-55433}"
trap 'pg_ctl -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
initdb -D "$D/data" -U postgres -A trust >/dev/null
pg_ctl -D "$D/data" -o "-h 127.0.0.1 -p $PORT -k $D" -l "$D/log" -w start >/dev/null
A=(-q -v ON_ERROR_STOP=1 -h "$D" -p "$PORT" -U postgres)
q() { psql "${A[@]}" "$@"; }
q <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.operators(operator_id uuid PRIMARY KEY, codename text UNIQUE NOT NULL);
CREATE TABLE public.codename_history(
 id bigserial PRIMARY KEY, operator_id uuid REFERENCES public.operators,
 old_codename text NOT NULL, new_codename text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codename_history ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.operators,public.codename_history TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.codename_history_id_seq TO service_role;
INSERT INTO public.operators VALUES
 ('00000000-0000-0000-0000-000000000001','old-alpha'),
 ('00000000-0000-0000-0000-000000000002','old-beta'),
 ('00000000-0000-0000-0000-000000000003','Taken-Name'),
 ('00000000-0000-0000-0000-000000000004','old-delta');
SQL
M=("$ROOT"/supabase/migrations/*_0056_atomic_codename_changes.sql)
q -f "${M[0]}"
q -f "${M[0]}"
q <<'SQL'
DO $$ BEGIN
 IF has_function_privilege('anon','public.change_operator_codename(uuid,text)','EXECUTE')
  OR has_function_privilege('authenticated','public.change_operator_codename(uuid,text)','EXECUTE')
  OR NOT has_function_privilege('service_role','public.change_operator_codename(uuid,text)','EXECUTE')
 THEN RAISE EXCEPTION 'RPC execution privileges incorrect'; END IF;
END $$;
SQL
q -At -c "BEGIN; SET LOCAL ROLE service_role; SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000001','first-name'); SELECT pg_sleep(1); COMMIT;" >"$D/first" &
FIRST=$!
for i in {1..100}; do
 if grep -q '^changed$' "$D/first"; then break; fi
 sleep 0.05
done
grep -q '^changed$' "$D/first"
q -At -c "SET ROLE service_role; SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000001','second-name');" >"$D/second"
wait "$FIRST"
grep -q '^cooldown$' "$D/second"
q <<'SQL'
DO $$ BEGIN
 IF (SELECT count(*) FROM public.codename_history WHERE operator_id='00000000-0000-0000-0000-000000000001') <> 1
  OR (SELECT codename FROM public.operators WHERE operator_id='00000000-0000-0000-0000-000000000001') <> 'first-name'
 THEN RAISE EXCEPTION 'Concurrent rename escaped cooldown'; END IF;
END $$;
SET ROLE service_role;
DO $$ BEGIN
 IF (SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000002','old-alpha')) <> 'held'
 THEN RAISE EXCEPTION 'Released name protection failed'; END IF;
 IF (SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000002','taken-name')) <> 'taken'
 THEN RAISE EXCEPTION 'Case-insensitive name collision failed'; END IF;
 IF (SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000002','admin')) <> 'invalid'
 THEN RAISE EXCEPTION 'Reserved name accepted'; END IF;
 IF (SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000002','new-beta')) <> 'changed'
 THEN RAISE EXCEPTION 'Ordinary rename failed'; END IF;
 UPDATE public.codename_history SET changed_at=clock_timestamp()-interval '744 hours'
  WHERE operator_id='00000000-0000-0000-0000-000000000001';
 IF (SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000001','old-alpha')) <> 'changed'
 THEN RAISE EXCEPTION 'Expired cooldown / own-name reclaim failed'; END IF;
END $$;
RESET ROLE;
CREATE FUNCTION public.reject_test_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.new_codename='fail-target' THEN RAISE EXCEPTION 'injected history failure'; END IF;
 IF NEW.new_codename='unique-fail' THEN RAISE EXCEPTION 'injected uniqueness failure' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reject_test_history BEFORE INSERT ON public.codename_history
 FOR EACH ROW EXECUTE FUNCTION public.reject_test_history();
SQL
if q -At -c "SET ROLE service_role; SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000004','fail-target');" >"$D/failure" 2>&1; then
 echo "Expected injected failure"; exit 1
fi
q -At -c "SET ROLE service_role; SELECT status FROM public.change_operator_codename('00000000-0000-0000-0000-000000000004','unique-fail');" >"$D/unique"
grep -q '^taken$' "$D/unique"
q <<'SQL'
DO $$ BEGIN
 IF (SELECT codename FROM public.operators WHERE operator_id='00000000-0000-0000-0000-000000000004') <> 'old-delta'
 OR EXISTS(SELECT 1 FROM public.codename_history WHERE operator_id='00000000-0000-0000-0000-000000000004')
 THEN RAISE EXCEPTION 'Failed history write left a partial rename'; END IF;
END $$;
SQL
echo "ALL-OK: concurrency, held names, expiry, rollback and RPC privileges"
