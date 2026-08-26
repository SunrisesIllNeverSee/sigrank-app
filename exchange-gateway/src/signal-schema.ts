/**
 * exchange-gateway/src/signal-schema.ts — Zod validation schemas for ExchangeSignal.
 *
 * Spec: Contribution Exchange Cold-Start Layer (§6).
 *
 * All seven signal types validate against the same base schema. The schema
 * enforces the required top-level fields, the non-obligation constraint on
 * consideration, and the authoritative_for_exchange_state: false invariant.
 */

import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const SignalTypeSchema = z.enum([
  "problem",
  "request",
  "challenge",
  "bounty",
  "verification",
  "discovery",
  "experiment",
]);

export const SignalStatusSchema = z.enum([
  "draft",
  "published",
  "paused",
  "closed",
  "expired",
  "withdrawn",
]);

export const ChallengeKindSchema = z.enum([
  "puzzle",
  "constraint_preservation",
  "governance_reasoning",
  "minimal_intervention",
  "provenance",
  "capability",
]);

export const AttemptStatusSchema = z.enum([
  "created",
  "submitted",
  "verification_pending",
  "verified",
  "rejected",
  "inconclusive",
  "verifier_error",
  "withdrawn",
  "expired",
]);

export const VerificationModeSchema = z.enum([
  "deterministic",
  "hybrid",
  "manual",
]);

export const VerificationOutcomeSchema = z.enum([
  "passed",
  "failed",
  "inconclusive",
  "verifier_error",
]);

export const QualificationStatusSchema = z.enum([
  "qualified",
  "not_qualified",
  "review_required",
  "inconclusive",
  "revoked",
  "expired",
  "consumed",
]);

export const FollowOnModeSchema = z.enum([
  "none",
  "domain_review",
  "proposal_allowed",
  "invite_to_propose",
  "draft_proposal",
]);

export const ProposalOriginKindSchema = z.enum([
  "exchange_signal",
  "unsolicited_opportunity",
  "direct_request",
  "other",
]);

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const SignalPublisherSchema = z.object({
  domain: z.string().min(3).max(253),
  steward: z.string().min(3).max(253),
  issuer_id: z.string().min(1).max(500),
  authentication_profile: z.object({
    method: z.string().min(1).max(200),
    key_id: z.string().min(1).max(200),
  }),
});

const SignalEvidenceSchema = z.object({
  evidence_id: z.string().min(1).max(200),
  kind: z.string().min(1).max(200),
  uri: z.string().min(1).max(2000),
  digest: z.string().max(500).optional(),
  observed_at: z.string().datetime().or(z.string().min(1)),
  claim: z.string().min(1).max(4000),
});

const SignalScopeSchema = z.object({
  included: z.array(z.string().min(1).max(1000)).min(1).max(50),
  excluded: z.array(z.string().min(1).max(1000)).max(50).default([]),
});

const SignalConstraintsSchema = z.object({
  production_write: z.boolean().default(false),
  repository_write: z.boolean().default(false),
  private_data_access: z.boolean().default(false),
  third_party_contact: z.boolean().default(false),
  financial_authority: z.boolean().default(false),
  network_access: z.object({
    mode: z.enum(["public_read_only", "none", "allowlisted"]),
    allowed_hosts: z.array(z.string().min(1).max(500)).max(50).optional(),
  }).optional(),
  required_behaviors: z.array(z.string().min(1).max(1000)).max(20).optional(),
});

const SignalParticipationSchema = z.object({
  visibility: z.enum(["public", "publisher_visible", "participants_only", "private"]).default("public"),
  eligibility: z.enum(["open", "restricted", "invited"]).default("open"),
  maximum_attempts_per_actor: z.number().int().min(1).max(100).default(3),
  concurrent_attempts_per_actor: z.number().int().min(1).max(10).default(1),
  anonymous_attempts: z.boolean().default(false),
  identity_assurance: z.string().min(1).max(200).default("authenticated_exchange_actor"),
});

const SignalSubmissionSchema = z.object({
  accepted_media_types: z.array(z.string().min(1).max(200)).min(1).max(20),
  maximum_bytes: z.number().int().min(1).max(10_000_000).default(262144),
  artifact_references_allowed: z.boolean().default(true),
  required_fields: z.array(z.string().min(1).max(200)).min(1).max(20),
});

const SignalVerificationCheckSchema = z.object({
  check_id: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  required: z.boolean().default(true),
});

const SignalVerificationResultContractSchema = z.object({
  outcomes: z.array(VerificationOutcomeSchema).min(1),
  score_range: z.object({
    minimum: z.number().int().min(0).max(100),
    maximum: z.number().int().min(0).max(100),
  }),
  passing_score: z.number().int().min(0).max(100),
});

const SignalVerificationSchema = z.object({
  mode: VerificationModeSchema,
  verifier: z.object({
    verifier_id: z.string().min(1).max(200),
    version: z.string().min(1).max(100),
    digest: z.string().min(1).max(500),
    runtime: z.string().min(1).max(200),
  }),
  inputs: z.object({
    signal_revision_hash: z.string().min(1).max(500),
  }).passthrough(),
  checks: z.array(SignalVerificationCheckSchema).min(1).max(50),
  result_contract: SignalVerificationResultContractSchema,
});

const SignalConsiderationSchema = z.object({
  mode: z.enum(["fixed", "maximum", "negotiable"]),
  advertised: z.boolean(),
  creates_obligation: z.literal(false),
  currency: z.string().length(3).optional(),
  amount: z.string().optional(),
  maximum_amount: z.string().optional(),
  note: z.string().max(2000).optional(),
}).refine(
  (data) => !data.creates_obligation,
  { message: "consideration.creates_obligation must be false — signals do not create obligations" },
);

const SignalFollowOnSchema = z.object({
  mode: FollowOnModeSchema,
  qualification_required: z.boolean().default(true),
  proposal_template: z.object({
    contribution_kind: z.string().min(1).max(200),
    copy_signal_evidence: z.boolean().default(true),
    copy_signal_constraints: z.boolean().default(true),
  }).optional(),
  commitment_automatic: z.literal(false),
  authorization_automatic: z.literal(false),
});

const SignalTimestampsSchema = z.object({
  created_at: z.string().datetime().or(z.string().min(1)),
  published_at: z.string().datetime().or(z.string().min(1)).optional(),
  accepts_attempts_until: z.string().datetime().or(z.string().min(1)).optional(),
  expires_at: z.string().datetime().or(z.string().min(1)).optional(),
});

const SignalLineageSchema = z.object({
  parent_signal_id: z.string().max(200).nullable().default(null),
  derived_from: z.array(z.object({
    kind: z.string().min(1).max(200),
    reference: z.string().min(1).max(2000),
  })).default([]),
});

const SignalDesiredOutcomeSchema = z.object({
  kind: z.enum(["artifact", "answer", "finding", "proof", "score", "result"]),
  media_types: z.array(z.string().min(1).max(200)).max(20).optional(),
  description: z.string().min(1).max(4000),
});

// ─── ExchangeSignal schema (for creating/managing signals) ───────────────────

export const ExchangeSignalInputSchema = z.object({
  schema_version: z.literal("exchange-signal/1.0"),
  signal_id: z.string().min(3).max(200).optional(), // auto-generated if absent
  type: SignalTypeSchema,
  challenge_kind: ChallengeKindSchema.optional(),
  title: z.string().trim().min(3).max(300),
  summary: z.string().trim().min(10).max(2000),
  description: z.string().trim().min(10).max(20_000),
  desired_outcome: SignalDesiredOutcomeSchema,
  evidence: z.array(SignalEvidenceSchema).max(50).optional(),
  scope: SignalScopeSchema,
  constraints: SignalConstraintsSchema,
  participation: SignalParticipationSchema,
  submission: SignalSubmissionSchema,
  verification: SignalVerificationSchema,
  consideration: SignalConsiderationSchema,
  follow_on: SignalFollowOnSchema,
  timestamps: SignalTimestampsSchema,
  labels: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  lineage: SignalLineageSchema.default({ parent_signal_id: null, derived_from: [] }),
});

export type ExchangeSignalInput = z.infer<typeof ExchangeSignalInputSchema>;

// ─── Signal attempt schema ───────────────────────────────────────────────────

export const SignalAttemptInputSchema = z.object({
  idempotency_key: z.string().min(1).max(200),
  declarations: z.object({
    constraints_observed: z.boolean(),
    unauthorized_actions_taken: z.boolean().refine(v => v === false, {
      message: "unauthorized_actions_taken must be false",
    }),
    requested_consideration: z.object({
      mode: z.enum(["accept_advertised", "accept_advertised_or_negotiate", "negotiate"]),
    }).optional(),
  }),
});

export type SignalAttemptInput = z.infer<typeof SignalAttemptInputSchema>;

export const SignalAttemptSubmissionSchema = z.object({
  media_type: z.string().min(1).max(200),
  body: z.string().max(10_000_000),
  artifact_references: z.array(z.object({
    uri: z.string().min(1).max(2000),
    digest: z.string().min(1).max(500),
  })).max(20).optional(),
});

export type SignalAttemptSubmission = z.infer<typeof SignalAttemptSubmissionSchema>;
