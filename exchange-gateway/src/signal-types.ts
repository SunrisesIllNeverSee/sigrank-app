/**
 * exchange-gateway/src/signal-types.ts — ExchangeSignal type definitions.
 *
 * Spec: Contribution Exchange Cold-Start Layer (§4-§9).
 *
 * The signal layer sits OUTSIDE the Contribution Exchange state machine.
 * No signal action can advance exchange state. Signals are informational
 * and invitational — they describe potential work and how attempts will be
 * evaluated, but they do not create obligations.
 */

// ─── Signal taxonomy (§4) ────────────────────────────────────────────────────

export type SignalType =
  | "problem"
  | "request"
  | "challenge"
  | "bounty"
  | "verification"
  | "discovery"
  | "experiment";

export type ChallengeKind =
  | "puzzle"
  | "constraint_preservation"
  | "governance_reasoning"
  | "minimal_intervention"
  | "provenance"
  | "capability";

// ─── Signal-local status (§6.3) ──────────────────────────────────────────────
// These are NOT Contribution Exchange states.

export type SignalStatus =
  | "draft"
  | "published"
  | "paused"
  | "closed"
  | "expired"
  | "withdrawn";

// ─── Attempt-local status (§7) ───────────────────────────────────────────────

export type AttemptStatus =
  | "created"
  | "submitted"
  | "verification_pending"
  | "verified"
  | "rejected"
  | "inconclusive"
  | "verifier_error"
  | "withdrawn"
  | "expired";

// ─── Verification (§8, §12) ──────────────────────────────────────────────────

export type VerificationMode = "deterministic" | "hybrid" | "manual";

export type VerificationOutcome =
  | "passed"
  | "failed"
  | "inconclusive"
  | "verifier_error";

export type VerificationStatus = VerificationOutcome;

// ─── Qualification (§9) ──────────────────────────────────────────────────────

export type QualificationStatus =
  | "qualified"
  | "not_qualified"
  | "review_required"
  | "inconclusive"
  | "revoked"
  | "expired"
  | "consumed";

export type FollowOnMode =
  | "none"
  | "domain_review"
  | "proposal_allowed"
  | "invite_to_propose"
  | "draft_proposal";

// ─── Core objects ────────────────────────────────────────────────────────────

export interface SignalPublisher {
  domain: string;
  steward: string;
  issuer_id: string;
  authentication_profile: {
    method: string;
    key_id: string;
  };
}

export interface SignalEvidence {
  evidence_id: string;
  kind: string;
  uri: string;
  digest?: string;
  observed_at: string;
  claim: string;
}

export interface SignalScope {
  included: string[];
  excluded: string[];
}

export interface SignalConstraints {
  production_write: boolean;
  repository_write: boolean;
  private_data_access: boolean;
  third_party_contact: boolean;
  financial_authority: boolean;
  network_access?: {
    mode: "public_read_only" | "none" | "allowlisted";
    allowed_hosts?: string[];
  };
  required_behaviors?: string[];
}

export interface SignalParticipation {
  visibility: "public" | "publisher_visible" | "participants_only" | "private";
  eligibility: "open" | "restricted" | "invited";
  maximum_attempts_per_actor: number;
  concurrent_attempts_per_actor: number;
  anonymous_attempts: boolean;
  identity_assurance: string;
}

export interface SignalSubmission {
  accepted_media_types: string[];
  maximum_bytes: number;
  artifact_references_allowed: boolean;
  required_fields: string[];
}

export interface SignalVerificationCheck {
  check_id: string;
  description: string;
  required: boolean;
}

export interface SignalVerificationResultContract {
  outcomes: VerificationOutcome[];
  score_range: { minimum: number; maximum: number };
  passing_score: number;
}

export interface SignalVerification {
  mode: VerificationMode;
  verifier: {
    verifier_id: string;
    version: string;
    digest: string;
    runtime: string;
  };
  inputs: {
    signal_revision_hash: string;
    [key: string]: unknown;
  };
  checks: SignalVerificationCheck[];
  result_contract: SignalVerificationResultContract;
}

export interface SignalConsideration {
  mode: "fixed" | "maximum" | "negotiable";
  advertised: boolean;
  creates_obligation: false;
  currency?: string;
  amount?: string;
  maximum_amount?: string;
  note?: string;
}

export interface SignalFollowOn {
  mode: FollowOnMode;
  qualification_required: boolean;
  proposal_template?: {
    contribution_kind: string;
    copy_signal_evidence: boolean;
    copy_signal_constraints: boolean;
  };
  commitment_automatic: false;
  authorization_automatic: false;
}

export interface SignalTimestamps {
  created_at: string;
  published_at?: string;
  accepts_attempts_until?: string;
  expires_at?: string;
}

export interface SignalLineage {
  parent_signal_id: string | null;
  derived_from: Array<{
    kind: string;
    reference: string;
  }>;
}

export interface SignalDesiredOutcome {
  kind: "artifact" | "answer" | "finding" | "proof" | "score" | "result";
  media_types?: string[];
  description: string;
}

// ─── ExchangeSignal (§6) ─────────────────────────────────────────────────────

export interface ExchangeSignal {
  schema_version: "exchange-signal/1.0";
  signal_id: string;
  revision: number;
  revision_hash: string;
  canonical_url: string;

  publisher: SignalPublisher;
  type: SignalType;
  status: SignalStatus;
  challenge_kind?: ChallengeKind;

  title: string;
  summary: string;
  description: string;

  desired_outcome: SignalDesiredOutcome;
  evidence?: SignalEvidence[];
  scope: SignalScope;
  constraints: SignalConstraints;
  participation: SignalParticipation;
  submission: SignalSubmission;
  verification: SignalVerification;
  consideration: SignalConsideration;
  follow_on: SignalFollowOn;
  timestamps: SignalTimestamps;
  labels?: string[];
  lineage: SignalLineage;
}

// ─── SignalAttempt (§7) ──────────────────────────────────────────────────────

export interface SignalAttempt {
  attempt_id: string;
  signal_id: string;
  signal_revision: number;
  signal_revision_hash: string;

  actor: {
    actor_id: string;
    authentication_method: string;
    key_id: string;
  };

  status: AttemptStatus;

  idempotency: {
    key: string;
    request_hash: string;
  };

  submission?: {
    submitted_at: string;
    media_type: string;
    body_hash: string;
    artifact_references?: Array<{
      uri: string;
      digest: string;
    }>;
  };

  declarations: {
    constraints_observed: boolean;
    unauthorized_actions_taken: boolean;
    requested_consideration?: {
      mode: "accept_advertised" | "accept_advertised_or_negotiate" | "negotiate";
    };
  };

  created_at: string;
  updated_at: string;
}

// ─── SignalVerificationResult (§8) ───────────────────────────────────────────

export interface SignalVerificationResult {
  verification_id: string;
  attempt_id: string;
  signal_revision_hash: string;

  verifier: {
    verifier_id: string;
    version: string;
    digest: string;
    executed_by: string;
  };

  status: VerificationStatus;
  authoritative_for_signal: true;
  authoritative_for_exchange_state: false;

  result: {
    score: number;
    checks: Array<{
      check_id: string;
      outcome: VerificationOutcome;
      evidence_hash: string;
    }>;
  };

  execution: {
    started_at: string;
    completed_at: string;
    runtime_ms: number;
    environment_digest: string;
    network_access: "disabled" | "allowlisted";
    resource_limits: {
      cpu_ms: number;
      memory_mb: number;
      output_bytes: number;
    };
  };

  signature: {
    key_id: string;
    algorithm: string;
    value: string;
  };

  created_at: string;
}

// ─── SignalQualification (§9) ────────────────────────────────────────────────

export interface SignalQualification {
  qualification_id: string;
  signal_id: string;
  signal_revision: number;
  attempt_id: string;
  verification_id: string;

  subject: {
    actor_id: string;
  };

  status: QualificationStatus;

  scope: {
    kind: "signal";
    value: string;
    permitted_follow_on: string[];
  };

  validity: {
    issued_at: string;
    expires_at: string;
    maximum_uses: number;
    uses_remaining: number;
  };

  issuer: {
    domain: string;
    key_id: string;
  };

  evidence: {
    verification_digest: string;
  };
}

// ─── Proposal origin (§10.4, §13.6) ──────────────────────────────────────────

export type ProposalOriginKind =
  | "exchange_signal"
  | "unsolicited_opportunity"
  | "direct_request"
  | "other";

export interface ProposalOrigin {
  origin_kind: ProposalOriginKind;
  signal_id?: string;
  signal_revision?: number;
  signal_revision_hash?: string;
  attempt_id?: string;
  verification_id?: string;
  qualification_id?: string;
  opportunity_id?: string;
  created_at: string;
}

// ─── Lineage record (§18.6) ──────────────────────────────────────────────────

export interface LineageRecord {
  id: string;
  exchange_id?: string;
  signal_id?: string;
  signal_revision_hash?: string;
  attempt_id?: string;
  submission_digest?: string;
  verification_id?: string;
  qualification_id?: string;
  proposal_id?: string;
  commitment_terms_hash?: string;
  execution_artifact_hash?: string;
  authoritative_verification_id?: string;
  settlement_id?: string;
  signing_identity?: string;
  signed_at?: string;
  event_type: string;
  created_at: string;
}
