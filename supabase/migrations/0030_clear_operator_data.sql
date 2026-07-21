-- 0030_clear_operator_data.sql — "Delete my data" opt-out + historical severance.
-- (D1 decision 2026-07-21: two-tier deletion model).
--
-- clear_operator_data() hard-deletes an operator's telemetry, audit trails, and
-- device bindings while keeping the account identity intact. It then sets
-- data_opt_out = TRUE so future submissions are rejected. This is the
-- "delete my data but keep my account" path.
--
-- delete_account() is updated to call clear_operator_data() first so the
-- "delete my account" path fully severs historical data before anonymizing the
-- operator row.
--
-- Both functions are idempotent and service-role only.

-- -----------------------------------------------------------------------------
-- clear_operator_data: telemetry + device severance, account preserved
-- -----------------------------------------------------------------------------
create or replace function public.clear_operator_data(p_operator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Forensic / state-change trails first (no FK dependencies on telemetry).
  delete from audit_log where operator_id = p_operator_id;
  delete from audit_records where operator_id = p_operator_id;
  delete from operator_actions where operator_id = p_operator_id;

  -- Derived / report artifacts.
  delete from operator_reparse where operator_id = p_operator_id;
  delete from operator_reports where operator_id = p_operator_id;

  -- Attestation memory tied to this operator's telemetry.
  delete from source_attestations where operator_id = p_operator_id;

  -- Session-level aggregates depend on snapshot_submissions.
  delete from session_summaries
  where submission_id in (
    select submission_id from snapshot_submissions where operator_id = p_operator_id
  );

  -- Raw submissions.
  delete from snapshot_submissions where operator_id = p_operator_id;

  -- Board-grade scored metrics and rollups.
  delete from metric_snapshots where operator_id = p_operator_id;
  delete from feature_rollups_daily where operator_id = p_operator_id;
  delete from rank_history where operator_id = p_operator_id;

  -- Badges derived from telemetry; they can be re-earned if data is re-submitted.
  delete from operator_badges where operator_id = p_operator_id;

  -- Sever all device bindings and enrollment codes.
  delete from device_enroll_codes where operator_id = p_operator_id;
  delete from devices where operator_id = p_operator_id;

  -- Mark the account as opted-out so the ingest gate rejects future submissions.
  update operators
  set data_opt_out = true,
      data_opt_out_at = now(),
      last_seen = now()
  where operator_id = p_operator_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- delete_account: now fully severs telemetry before anonymizing the row
-- -----------------------------------------------------------------------------
create or replace function public.delete_account(p_operator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Full data severance first (D1: "delete my account" = clear history + retire).
  perform public.clear_operator_data(p_operator_id);

  -- Anonymize + retire the operator row.
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
end;
$$;

-- Service-role only.
revoke all on function public.clear_operator_data(uuid) from public, anon, authenticated;
revoke all on function public.delete_account(uuid) from public, anon, authenticated;
