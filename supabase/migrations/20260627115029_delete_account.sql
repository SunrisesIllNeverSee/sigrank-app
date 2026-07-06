create or replace function public.delete_account(p_operator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
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

  update devices
  set trust_status = 'revoked'
  where operator_id = p_operator_id;
end;
$$;

revoke all on function public.delete_account(uuid) from public, anon, authenticated;;
