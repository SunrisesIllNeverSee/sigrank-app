-- Contribution Exchange Gateway v0.2 — hosted on signalaf.com (SigRank Supabase)
-- Tracks domain-native agent contribution exchanges + encounter observability.
-- Server routes use service_role. Client roles receive no direct table privileges.

create extension if not exists pgcrypto;

-- ─── Companies (participating domains) ──────────────────────────────────────
create table if not exists public.exchange_companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  domain text not null unique,
  contact_name text not null,
  contact_email text not null,
  country text not null,
  address jsonb not null default '{}'::jsonb,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  verification_token text not null,
  admin_key_hash text,
  domain_agent_key_hash text,
  accepts_unsolicited boolean not null default true,
  accepts_requests boolean not null default true,
  categories text[] not null default '{}',
  agent_mode text not null default 'hosted_steward' check (agent_mode in ('hosted_steward','bring_your_own','passive')),
  exchange_agent_endpoint text,
  exchange_policy jsonb not null default '{}'::jsonb,
  transaction_enabled boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Registered agents (optional) ───────────────────────────────────────────
create table if not exists public.exchange_agents (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  did text unique,
  email text,
  capabilities text[] not null default '{}',
  agent_key_hash text not null,
  referral_code text not null unique,
  referred_by_code text,
  payout_provider text check (payout_provider in ('stripe_connect','manual')),
  payout_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Exchange records (proposals + requests) ────────────────────────────────
create table if not exists public.exchange_records (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  kind text not null check (kind in ('contribution_proposal','contribution_request')),
  state text not null default 'proposed' check (state in ('observed','proposed','engaged','negotiating','committed','authorized','delivering','delivered','verified','settled','closed','declined','expired','disputed','revoked')),
  target_domain text not null,
  company_id uuid references public.exchange_companies(id) on delete set null,
  initiator_agent_id uuid references public.exchange_agents(id) on delete set null,
  initiator_identity jsonb not null default '{}'::jsonb,
  title text not null,
  observation text,
  proposed_contribution text,
  requested_contribution text,
  desired_outcome text,
  offering text,
  evidence jsonb not null default '[]'::jsonb,
  proposed_consideration jsonb not null default '[]'::jsonb,
  commitment jsonb,
  terms_hash text,
  commitment_acceptances jsonb not null default '{}'::jsonb,
  proposer_key_hash text not null,
  referral_code text,
  economic_attribution jsonb not null default '{}'::jsonb,
  proposal_detail jsonb not null default '{}'::jsonb,
  steward_status text not null default 'unprocessed' check (steward_status in ('unprocessed','engaged','escalated','delivered_to_byo','failed')),
  escalation_required boolean not null default false,
  escalation_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exchange_records_target_domain_state_idx on public.exchange_records(target_domain, state, created_at desc);
create index if not exists exchange_records_agent_idx on public.exchange_records(initiator_agent_id, created_at desc);
create index if not exists exchange_records_company_idx on public.exchange_records(company_id, created_at desc);
create index if not exists exchange_records_escalation_idx on public.exchange_records(company_id, escalation_required, created_at desc);

-- ─── Exchange events (append-only lifecycle log) ────────────────────────────
create table if not exists public.exchange_events (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchange_records(id) on delete cascade,
  event_type text not null,
  actor jsonb not null default '{}'::jsonb,
  from_state text,
  to_state text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists exchange_events_exchange_created_idx on public.exchange_events(exchange_id, created_at);

-- ─── Settlements ────────────────────────────────────────────────────────────
create table if not exists public.exchange_settlements (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null unique references public.exchange_records(id) on delete cascade,
  provider text not null default 'manual',
  currency text not null default 'USD',
  gross_cents bigint not null check (gross_cents >= 0),
  platform_fee_bps integer not null default 500 check (platform_fee_bps between 0 and 2500),
  platform_fee_cents bigint not null default 0,
  referral_commission_bps integer not null default 0,
  referral_commission_cents bigint not null default 0,
  checkout_session_id text unique,
  payment_intent_id text,
  status text not null default 'pending' check (status in ('pending','awaiting_payment','manual_required','settled','failed','refunded','disputed')),
  metadata jsonb not null default '{}'::jsonb,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Encounter tracking (the observability layer) ───────────────────────────
-- Logs every agent encounter with an exchange surface: profile reads, steward
-- hits, preflights, proposal attempts (even failed ones). This is the top-of-
-- funnel visibility that exchange_records alone doesn't capture.
create table if not exists public.exchange_encounters (
  id uuid primary key default gen_random_uuid(),
  target_domain text not null,
  endpoint text not null,
  method text not null default 'GET',
  user_agent text,
  ip_hash text,
  agent_identity jsonb not null default '{}'::jsonb,
  result text not null default 'ok' check (result in ('ok','not_found','rate_limited','validation_error','auth_error','server_error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists exchange_encounters_domain_created_idx on public.exchange_encounters(target_domain, created_at desc);
create index if not exists exchange_encounters_endpoint_created_idx on public.exchange_encounters(endpoint, created_at desc);
create index if not exists exchange_encounters_result_idx on public.exchange_encounters(result, created_at desc);

-- ─── RLS: service_role only ─────────────────────────────────────────────────
alter table public.exchange_companies enable row level security;
alter table public.exchange_agents enable row level security;
alter table public.exchange_records enable row level security;
alter table public.exchange_events enable row level security;
alter table public.exchange_settlements enable row level security;
alter table public.exchange_encounters enable row level security;

revoke all on table public.exchange_companies from anon, authenticated;
revoke all on table public.exchange_agents from anon, authenticated;
revoke all on table public.exchange_records from anon, authenticated;
revoke all on table public.exchange_events from anon, authenticated;
revoke all on table public.exchange_settlements from anon, authenticated;
revoke all on table public.exchange_encounters from anon, authenticated;

grant all on table public.exchange_companies to service_role;
grant all on table public.exchange_agents to service_role;
grant all on table public.exchange_records to service_role;
grant all on table public.exchange_events to service_role;
grant all on table public.exchange_settlements to service_role;
grant all on table public.exchange_encounters to service_role;

-- ─── Reference domain: signalaf.com ─────────────────────────────────────────
insert into public.exchange_companies (
  legal_name, domain, contact_name, contact_email, country, address,
  verification_status, verification_token, accepts_unsolicited, accepts_requests,
  categories, agent_mode, transaction_enabled, verified_at
) values (
  'Ello Cello LLC', 'signalaf.com', 'Operator', 'burnmydays@proton.me', 'US',
  '{"addressLine1":"84 W Utica St","city":"Buffalo","region":"NY","postalCode":"14209"}'::jsonb,
  'verified', 'reference-install', true, true,
  array['technical','accessibility','documentation','research','data','integration','commercial introduction','workflow improvement','product improvement'],
  'hosted_steward', true, now()
)
on conflict (domain) do update set
  legal_name = excluded.legal_name,
  verification_status = 'verified',
  accepts_unsolicited = true,
  accepts_requests = true,
  categories = excluded.categories,
  agent_mode = 'hosted_steward',
  transaction_enabled = true,
  verified_at = coalesce(public.exchange_companies.verified_at, now()),
  updated_at = now();

-- Seed default exchange policy for the reference domain
update public.exchange_companies set exchange_policy = jsonb_build_object(
  'version','0.2',
  'auto_engage', jsonb_build_object(
    'enabled', true,
    'max_cash', 250,
    'allowed_categories', to_jsonb(categories),
    'allowed_consideration', jsonb_build_array('cash','attribution','referral','other')
  ),
  'escalation', jsonb_build_object(
    'royalty', true, 'reciprocal_access', true, 'repository_write', true,
    'private_data', true, 'credential_access', true, 'production_modify', true,
    'deploy', true, 'penetration_testing', true
  ),
  'authority_ceiling', jsonb_build_object(
    'inspect_public', true, 'sandbox_test', false, 'repository_read', false,
    'repository_write', false, 'private_data', false, 'credential_access', false,
    'production_modify', false, 'deploy', false, 'penetration_testing', false
  ),
  'human_required_for_commitment', true,
  'human_required_for_execution', true
)
where domain = 'signalaf.com' and exchange_policy = '{}'::jsonb;
