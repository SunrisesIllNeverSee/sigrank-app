-- Exchange Signal Cold-Start Layer (§13)
--
-- Implements the signal layer database model:
--   exchange_signals (§13.1) — stable identity + current admin state
--   exchange_signal_revisions (§13.2) — immutable published content
--   signal_attempts (§13.3) — agent attempts
--   signal_verifications (§13.4) — append-only verification records
--   signal_qualifications (§13.5) — scoped, signed, expiring qualifications
--   contribution_proposal_origins (§13.6) — proposal provenance linkage
--   exchange_lineage (§18.6) — immutable lineage records
--
-- CRITICAL INVARIANT: No signal table may advance Contribution Exchange state.
-- The signal layer sits OUTSIDE the exchange state machine. Database roles
-- for signal services must not have write access to exchange_records.state.

create extension if not exists pgcrypto;

-- ─── exchange_signals (§13.1) ───────────────────────────────────────────────
-- Stores stable identity and current administrative state.

create table if not exists public.exchange_signals (
  id text primary key,  -- sig_... (stable signal identity)
  publisher_domain text not null,
  steward_domain text not null,
  type text not null check (type in ('problem','request','challenge','bounty','verification','discovery','experiment')),
  status text not null default 'draft' check (status in ('draft','published','paused','closed','expired','withdrawn')),
  current_revision integer not null default 0,
  canonical_url text not null,
  visibility text not null default 'public' check (visibility in ('public','publisher_visible','participants_only','private')),
  challenge_kind text check (challenge_kind in ('puzzle','constraint_preservation','governance_reasoning','minimal_intervention','provenance','capability')),
  title text not null,
  summary text not null,
  labels text[] not null default '{}',
  -- Mirrored from the current revision so the collection endpoint can
  -- filter on these without joining to exchange_signal_revisions.
  -- published_at is the publication date (from revision 1), preserved
  -- across subsequent revisions. Distinct from created_at (draft creation).
  published_at timestamptz,
  expires_at timestamptz,
  accepts_attempts_until timestamptz,
  verification_mode text check (verification_mode in ('deterministic','hybrid','manual')),
  consideration_mode text check (consideration_mode in ('fixed','maximum','negotiable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists exchange_signals_status_idx on public.exchange_signals(status, created_at desc);
create index if not exists exchange_signals_domain_idx on public.exchange_signals(publisher_domain, status, created_at desc);
create index if not exists exchange_signals_type_idx on public.exchange_signals(type, status, created_at desc);
create index if not exists exchange_signals_expires_idx on public.exchange_signals(expires_at) where expires_at is not null;
create index if not exists exchange_signals_verification_mode_idx on public.exchange_signals(verification_mode) where verification_mode is not null;
create index if not exists exchange_signals_published_at_idx on public.exchange_signals(published_at desc) where published_at is not null;

-- ─── exchange_signal_revisions (§13.2) ──────────────────────────────────────
-- Stores immutable published content. Published revisions CANNOT be updated.

create table if not exists public.exchange_signal_revisions (
  signal_id text not null references public.exchange_signals(id) on delete cascade,
  revision integer not null check (revision > 0),
  canonical_document jsonb not null,
  revision_hash text not null,
  publisher_key_id text not null,
  publisher_signature text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  accepts_attempts_until timestamptz,
  expires_at timestamptz,
  primary key (signal_id, revision),
  unique (revision_hash)
);

create index if not exists exchange_signal_revisions_hash_idx on public.exchange_signal_revisions(revision_hash);
create index if not exists exchange_signal_revisions_published_idx on public.exchange_signal_revisions(published_at desc) where published_at is not null;

-- ─── signal_attempts (§13.3) ────────────────────────────────────────────────

create table if not exists public.signal_attempts (
  id text primary key,  -- att_...
  signal_id text not null references public.exchange_signals(id) on delete cascade,
  signal_revision integer not null,
  signal_revision_hash text not null,
  actor_id text not null,
  actor_key_id text not null,
  status text not null default 'created' check (status in ('created','submitted','verification_pending','verified','rejected','inconclusive','verifier_error','withdrawn','expired')),
  idempotency_key text not null,
  request_hash text not null,
  submission_json jsonb,
  submission_body_hash text,
  submission_media_type text,
  declarations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  -- An attempt binds to the exact revision it was created under
  foreign key (signal_id, signal_revision) references public.exchange_signal_revisions(signal_id, revision),
  -- Idempotency: same signal + actor + idempotency_key = same attempt
  unique (signal_id, actor_id, idempotency_key)
);

create index if not exists signal_attempts_signal_idx on public.signal_attempts(signal_id, status, created_at desc);
create index if not exists signal_attempts_actor_idx on public.signal_attempts(actor_id, status, created_at desc);
create index if not exists signal_attempts_revision_idx on public.signal_attempts(signal_id, signal_revision_hash);

-- ─── signal_verifications (§13.4) ───────────────────────────────────────────
-- Append-only. A rerun creates another record.

create table if not exists public.signal_verifications (
  id text primary key,  -- ver_...
  attempt_id text not null references public.signal_attempts(id) on delete cascade,
  signal_revision_hash text not null,
  verifier_id text not null,
  verifier_version text not null,
  verifier_digest text not null,
  run_number integer not null default 1,
  status text not null check (status in ('passed','failed','inconclusive','verifier_error')),
  result_json jsonb not null default '{}'::jsonb,
  result_digest text not null,
  environment_digest text not null,
  issuer_key_id text not null,
  issuer_signature text,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
  -- CRITICAL: verification is authoritative for the signal attempt ONLY,
  -- never for exchange state. This is enforced by application code + RLS.
  -- The status CHECK constraint above already restricts to the four valid
  -- outcomes. No additional placeholder constraint is needed.
);

create index if not exists signal_verifications_attempt_idx on public.signal_verifications(attempt_id, run_number);

-- ─── signal_qualifications (§13.5) ──────────────────────────────────────────

create table if not exists public.signal_qualifications (
  id text primary key,  -- qual_...
  signal_id text not null references public.exchange_signals(id) on delete cascade,
  signal_revision integer not null,
  attempt_id text not null references public.signal_attempts(id) on delete cascade,
  verification_id text not null references public.signal_verifications(id) on delete cascade,
  subject_actor_id text not null,
  status text not null default 'qualified' check (status in ('qualified','not_qualified','review_required','inconclusive','revoked','expired','consumed')),
  scope_json jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  maximum_uses integer not null default 1,
  uses_remaining integer not null default 1,
  issuer_domain text not null,
  issuer_key_id text not null,
  issuer_signature text,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now()
);

create index if not exists signal_qualifications_subject_idx on public.signal_qualifications(subject_actor_id, status);
create index if not exists signal_qualifications_signal_idx on public.signal_qualifications(signal_id, status);

-- ─── contribution_proposal_origins (§13.6) ──────────────────────────────────
-- Links proposals to their origin (signal or unsolicited opportunity).
-- Does NOT change Commitment state — only adds provenance.

create table if not exists public.contribution_proposal_origins (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.exchange_records(id) on delete cascade,
  origin_kind text not null check (origin_kind in ('exchange_signal','unsolicited_opportunity','direct_request','other')),
  signal_id text,
  signal_revision integer,
  signal_revision_hash text,
  attempt_id text,
  verification_id text,
  qualification_id text,
  opportunity_id text,
  created_at timestamptz not null default now()
);

create index if not exists contribution_proposal_origins_proposal_idx on public.contribution_proposal_origins(proposal_id);
create index if not exists contribution_proposal_origins_signal_idx on public.contribution_proposal_origins(signal_id) where signal_id is not null;

-- ─── exchange_lineage (§18.6) ───────────────────────────────────────────────
-- Immutable lineage records. Persists the full provenance chain from signal
-- through proposal, commitment, execution, verification, and settlement.
-- Survives provider changes, failed execution, disputes, and signal closure.

create table if not exists public.exchange_lineage (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid references public.exchange_records(id) on delete set null,
  signal_id text,
  signal_revision_hash text,
  attempt_id text,
  submission_digest text,
  verification_id text,
  qualification_id text,
  proposal_id uuid,
  commitment_terms_hash text,
  execution_artifact_hash text,
  authoritative_verification_id text,
  settlement_id uuid,
  signing_identity text,
  signed_at timestamptz,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists exchange_lineage_exchange_idx on public.exchange_lineage(exchange_id, created_at);
create index if not exists exchange_lineage_signal_idx on public.exchange_lineage(signal_id, created_at) where signal_id is not null;
create index if not exists exchange_lineage_attempt_idx on public.exchange_lineage(attempt_id, created_at) where attempt_id is not null;

-- ─── RLS policies ───────────────────────────────────────────────────────────
-- Public callers may read published public signal revisions.
-- Actors may read their own private attempts and results.
-- Publishers and authorized Stewards may read attempts for their signals.
-- Verifier workers may write verification records but not modify signal
-- definitions or exchange records.

alter table public.exchange_signals enable row level security;
alter table public.exchange_signal_revisions enable row level security;
alter table public.signal_attempts enable row level security;
alter table public.signal_verifications enable row level security;
alter table public.signal_qualifications enable row level security;
alter table public.contribution_proposal_origins enable row level security;
alter table public.exchange_lineage enable row level security;

-- Public read access for published public signals
create policy "public_read_published_signals" on public.exchange_signals
  for select using (
    status in ('published','paused','closed','expired','withdrawn')
    and visibility = 'public'
  );

create policy "public_read_published_revisions" on public.exchange_signal_revisions
  for select using (published_at is not null);

-- Actors may read their own private attempts (§13.7).
-- The actor_id is stored on the attempt row. Anon/authenticated keys can
-- only read attempts where actor_id matches the requester's identity.
-- In practice, the API routes use the service_role key (which bypasses RLS)
-- and enforce actor-scoping in application code. This policy provides a
-- defense-in-depth DB-level guard for any direct client access.
create policy "actor_read_own_attempts" on public.signal_attempts
  for select using (
    -- Service role bypasses RLS entirely; this policy covers anon/authenticated.
    -- actor_id is compared against the request.jwt ->> 'actor_id' claim when
    -- present, or denied otherwise. The API layer enforces the binding.
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'actor_id', '') = actor_id
  );

-- Verifications: an actor may read verifications for their own attempts.
-- This is a join-level guard — since signal_verifications references
-- signal_attempts, and attempts are actor-scoped, we allow select when the
-- referenced attempt belongs to the requester.
create policy "actor_read_own_verifications" on public.signal_verifications
  for select using (
    exists (
      select 1 from public.signal_attempts a
      where a.id = signal_verifications.attempt_id
        and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'actor_id', '') = a.actor_id
    )
  );

-- Qualifications: an actor may read their own qualifications.
create policy "actor_read_own_qualifications" on public.signal_qualifications
  for select using (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'actor_id', '') = subject_actor_id
  );

-- Proposal origins and lineage: no public read access.
-- These are only accessible via the service role (API routes).
-- RLS enable + no policy = deny-by-default for anon/authenticated.

-- Service role has full access (used by API routes with service_role key)
-- All write operations go through the service role, which bypasses RLS.
-- The policies above ensure that anon/authenticated keys can only read
-- published public signals, their own attempts/verifications/qualifications,
-- and not drafts, private signals, or other actors' attempts.
