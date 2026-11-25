-- 0060: let exchange_mcp_calls record requests that are not tool calls under
-- their own operation, so operation = 'tools_call' means a real tools/call.
--   unsupported_method: JSON-RPC method the server does not implement
--                       (real method name is in metadata->>'method')
--   invalid_request:    unparseable body, malformed envelope, or unsupported
--                       protocol version
-- Rows already written keep their old operation value.
ALTER TABLE public.exchange_mcp_calls
  DROP CONSTRAINT IF EXISTS exchange_mcp_calls_operation_check;
ALTER TABLE public.exchange_mcp_calls
  ADD CONSTRAINT exchange_mcp_calls_operation_check
  CHECK (operation IN ('initialize', 'tools_list', 'tools_call', 'unsupported_method', 'invalid_request'));
