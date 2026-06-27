-- 0020_delete_account.sql — permanent, integrity-preserving account deletion
-- (owner 2026-06-27). Spec: docs/superpowers/specs/2026-06-27-account-deletion-design.md.
--
-- delete_account() ANONYMIZES + RETIRES an operator in one transaction. It does NOT
-- hard-delete the operator or their token-cascade history — the ranked row survives as
-- an anonymous data point (board integrity = the moat). The codename is rewritten to
-- 'retired-<short-hash>' so the old name/email never resurface and the slot stays
-- occupied forever. PII is scrubbed; devices are revoked; the Stripe pointer is nulled.
--
-- The auth.users row (the email) is removed SEPARATELY by the route via the Supabase
-- Auth admin API — it is not reachable from a public-schema SQL function. Deleting the
-- auth user cascades operator_accounts (0009: ON DELETE CASCADE), severing login.
--
-- Stripe subscription cancellation also happens route-side BEFORE this runs (so a live
-- subscription is never left billing a now-anonymous row).
--
-- Idempotent: re-running on an already-retired operator is a stable no-op-ish UPDATE
-- (the substr-based codename is deterministic).

create or replace function public.delete_account(p_operator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Anonymize + retire the operator row. snapshots/submissions/challenges UNTOUCHED.
  update operators
  set codename           = 'retired-' || substr(operator_id::text, 1, 8),
      display_name       = null,
      claim_contact      = null,
      claim_payment_id   = null,
      stripe_customer_id = null,
      claimed            = false,
      status             = 'retired',
      privacy_level      = 'anonymous'
  where operator_id = p_operator_id;

  -- Kill any agent still submitting under this operator's devices.
  update devices
  set trust_status = 'revoked'
  where operator_id = p_operator_id;
end;
$$;

-- Service-role only (the route calls it via the service client). Revoke from anon/authed.
revoke all on function public.delete_account(uuid) from public, anon, authenticated;
