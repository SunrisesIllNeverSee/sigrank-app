-- 0060: let exchange_mcp_calls record requests that are not tool calls under
-- their own operation, so operation = 'tools_call' means a real tools/call.
--   unsupported_method: JSON-RPC method the server does not implement
--                       (truncated method name is in metadata->>'method')
--   invalid_request:    unparseable body, malformed envelope, or unsupported
--                       protocol version
-- Rows already written keep their old operation value.
--
-- Migration 0042 declared the CHECK inline on the column, so Postgres named it
-- exchange_mcp_calls_operation_check. The DO block drops whichever CHECK
-- constraint covers only the `operation` column (by pg_constraint lookup), so
-- it does not depend on that name, and re-running is safe.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.exchange_mcp_calls'::regclass
      AND con.contype = 'c'
      AND con.conkey = ARRAY[(
        SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = con.conrelid AND a.attname = 'operation'
      )]
  LOOP
    EXECUTE format('ALTER TABLE public.exchange_mcp_calls DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE public.exchange_mcp_calls
  DROP CONSTRAINT IF EXISTS exchange_mcp_calls_operation_check;
ALTER TABLE public.exchange_mcp_calls
  ADD CONSTRAINT exchange_mcp_calls_operation_check
  CHECK (operation IN ('initialize', 'tools_list', 'tools_call', 'unsupported_method', 'invalid_request'));
