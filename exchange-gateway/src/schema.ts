import { z } from 'zod'

const domainSchema = z.string().trim().min(3).max(253).transform((value) =>
  value.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase()
)

const actorSchema = z.object({
  type: z.enum(['domain', 'organization', 'agent', 'human', 'system']),
  id: z.string().min(1).max(500),
  displayName: z.string().max(200).optional(),
  url: z.string().url().optional(),
  did: z.string().max(500).optional(),
  email: z.string().email().optional(),
})

export const ConsiderationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('cash'), amount: z.number().positive().max(10_000_000), currency: z.string().length(3).transform(v => v.toUpperCase()) }),
  z.object({ type: z.literal('royalty'), rate: z.number().positive().max(100), basis: z.string().min(1).max(500), duration: z.string().max(200).optional() }),
  z.object({ type: z.literal('reciprocal_access'), asset: z.string().min(1).max(1000), scope: z.string().max(1000).optional() }),
  z.object({ type: z.literal('reciprocal_contribution'), description: z.string().min(1).max(4000) }),
  z.object({ type: z.literal('attribution'), lineageCredit: z.boolean(), display: z.string().max(500).optional() }),
  z.object({ type: z.literal('referral'), rate: z.number().min(0).max(100).optional(), basis: z.string().max(500).optional() }),
  z.object({ type: z.literal('other'), description: z.string().min(1).max(4000) }),
])

const DEFAULT_PROPOSAL_AUTHORITY = {
  inspect_public: true,
  sandbox_test: false,
  repository_read: false,
  repository_write: false,
  private_data: false,
  credential_access: false,
  production_modify: false,
  deploy: false,
  penetration_testing: false,
}

export const ProposalAuthoritySchema = z.object({
  inspect_public: z.boolean().default(true),
  sandbox_test: z.boolean().default(false),
  repository_read: z.boolean().default(false),
  repository_write: z.boolean().default(false),
  private_data: z.boolean().default(false),
  credential_access: z.boolean().default(false),
  production_modify: z.boolean().default(false),
  deploy: z.boolean().default(false),
  penetration_testing: z.boolean().default(false),
  other: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
})

const ProposalDetailFields = {
  category: z.string().trim().min(1).max(100).default('other'),
  confidence: z.object({ score: z.number().min(0).max(1), basis: z.string().trim().max(2000).optional() }).optional(),
  impact: z.object({ expectedChange: z.string().trim().min(1).max(4000), assumptions: z.array(z.string().trim().min(1).max(1000)).max(20).default([]) }).optional(),
  requiredAuthorization: ProposalAuthoritySchema.default(DEFAULT_PROPOSAL_AUTHORITY),
  verification: z.object({ method: z.string().trim().min(1).max(500), criteria: z.array(z.string().trim().min(1).max(1000)).min(1).max(50) }).optional(),
  effort: z.object({ agentMinutes: z.number().nonnegative().max(1_000_000).optional(), humanMinutes: z.number().nonnegative().max(1_000_000).optional(), elapsedHours: z.number().nonnegative().max(100_000).optional() }).optional(),
}

export const ContributionCommitmentSchema = z.object({
  version: z.literal('0.1'),
  contribution_id: z.string().min(3).max(100),
  origin: z.object({
    type: z.enum(['ambient_observation', 'published_need', 'published_offer', 'direct_request', 'other']),
    observed_at: z.string().url().optional(),
    description: z.string().max(4000).optional(),
  }),
  parties: z.object({ contributor: actorSchema, recipient: actorSchema }),
  contribution: z.object({
    type: z.string().min(1).max(200),
    title: z.string().min(3).max(300),
    description: z.string().min(10).max(20_000),
    disclosure_state: z.enum(['protected', 'evaluation', 'authorized', 'released']),
    artifact: z.object({
      kind: z.string().max(200).optional(),
      hash: z.string().max(500).optional(),
      uri: z.string().max(2000).optional(),
      lineage: z.array(z.string().max(1000)).max(100).optional(),
      custody: z.enum(['contributor', 'recipient', 'escrow', 'shared', 'none']).optional(),
    }).optional(),
  }),
  consideration: z.array(ConsiderationSchema).max(20),
  rights: z.object({
    owner: z.string().min(1).max(500),
    pre_vesting: z.object({
      license: z.string().min(1).max(500),
      deploy: z.enum(['prohibited', 'permitted']),
      derivative_use: z.enum(['prohibited', 'permitted']).optional(),
    }),
    post_vesting: z.object({
      license: z.string().min(1).max(500),
      deploy: z.enum(['prohibited', 'permitted']),
      derivative_use: z.enum(['prohibited', 'permitted']).optional(),
    }),
    attribution_required: z.boolean().optional(),
  }),
  vesting: z.object({
    requires: z.array(z.enum(['authorization', 'delivery', 'verification', 'settlement', 'other'])).min(1).max(10),
    other_conditions: z.array(z.string().max(1000)).max(20).optional(),
  }),
  authorization: z.object({
    inspect: z.boolean(),
    test: z.boolean(),
    modify: z.boolean(),
    deploy: z.boolean(),
    access_scope: z.array(z.string().max(500)).max(50).optional(),
  }),
  verification: z.object({
    criteria: z.array(z.string().min(1).max(1000)).min(1).max(50),
    verifier: actorSchema.optional(),
    evidence: z.array(z.string().max(2000)).max(100).optional(),
  }),
  settlement: z.object({
    status: z.enum(['not_required', 'pending', 'awaiting_payment', 'manual_required', 'settled', 'failed']),
    mechanism: z.string().max(300).optional(),
    escrow: z.boolean().optional(),
  }),
  revocation: z.object({
    authorization: z.enum(['revocable', 'irrevocable', 'not_applicable']),
    access: z.enum(['revocable', 'irrevocable', 'not_applicable']),
    license_pre_vesting: z.enum(['withdrawable', 'nonwithdrawable', 'not_applicable']),
    license_post_vesting: z.enum(['breach_only', 'nonrevocable', 'revocable', 'not_applicable']),
    artifact_recall: z.enum(['not_guaranteed', 'supported']),
  }),
  provenance: z.object({
    terms_hash: z.string().max(500).optional(),
    parent: z.string().max(500).optional(),
    descendants: z.array(z.string().max(500)).max(100).optional(),
    attribution_required: z.boolean().optional(),
  }),
})

export const CompanyRegistrationSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  domain: domainSchema,
  contactName: z.string().trim().min(2).max(200),
  contactEmail: z.string().email(),
  country: z.string().trim().min(2).max(100),
  addressLine1: z.string().trim().max(300).optional(),
  city: z.string().trim().max(150).optional(),
  region: z.string().trim().max(150).optional(),
  postalCode: z.string().trim().max(40).optional(),
  acceptsUnsolicited: z.boolean().default(true),
  acceptsRequests: z.boolean().default(true),
  categories: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  agentMode: z.enum(['hosted_steward','bring_your_own','passive']).default('hosted_steward'),
  exchangeAgentEndpoint: z.string().url().optional(),
  honeypot: z.string().max(0).optional(),
})

export const ExchangePolicyUpdateSchema = z.object({
  domain: domainSchema,
  agentMode: z.enum(['hosted_steward','bring_your_own','passive']),
  exchangeAgentEndpoint: z.string().url().nullable().optional(),
  autoEngageEnabled: z.boolean(),
  autoEngageMaxCash: z.number().nonnegative().max(10_000_000),
  allowedCategories: z.array(z.string().trim().min(1).max(100)).max(50),
  humanRequiredForCommitment: z.boolean().default(true),
  humanRequiredForExecution: z.boolean().default(true),
})

export const AgentRegistrationSchema = z.object({
  displayName: z.string().trim().min(2).max(200),
  did: z.string().trim().max(500).optional(),
  email: z.string().email().optional(),
  capabilities: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  referredByCode: z.string().trim().max(100).optional(),
  payoutProvider: z.enum(['stripe_connect', 'manual']).optional(),
  payoutAccountId: z.string().trim().max(200).optional(),
  honeypot: z.string().max(0).optional(),
})

const baseExchange = {
  targetDomain: domainSchema,
  title: z.string().trim().min(5).max(300),
  evidenceUris: z.array(z.string().url()).max(20).default([]),
  agentId: z.string().uuid().optional(),
  agentDid: z.string().trim().max(500).optional(),
  agentName: z.string().trim().max(200).optional(),
  contactEmail: z.string().email().optional(),
  referralCode: z.string().trim().max(100).optional(),
  consideration: z.array(ConsiderationSchema).max(20).default([]),
  honeypot: z.string().max(0).optional(),
  ...ProposalDetailFields,
}

export const ProposalSchema = z.object({
  ...baseExchange,
  observation: z.string().trim().min(10).max(20_000),
  proposedContribution: z.string().trim().min(10).max(20_000),
  desiredOutcome: z.string().trim().max(4000).optional(),
})

export const RequestSchema = z.object({
  ...baseExchange,
  requestedContribution: z.string().trim().min(10).max(20_000),
  offering: z.string().trim().max(10_000).optional(),
  reason: z.string().trim().max(10_000).optional(),
})

export const StewardPreflightSchema = z.object({
  type: z.literal('preflight'),
  proposal: z.object({
    category: ProposalDetailFields.category,
    consideration: z.array(ConsiderationSchema).max(20).default([]),
    requiredAuthorization: ProposalDetailFields.requiredAuthorization,
    confidence: ProposalDetailFields.confidence,
  }),
})

export const TransitionSchema = z.object({
  toState: z.enum(['engaged','negotiating','committed','authorized','delivering','delivered','verified','closed','declined','expired','disputed','revoked']),
  note: z.string().max(10_000).optional(),
  commitment: ContributionCommitmentSchema.optional(),
})

// ─── Execution Provider Schemas ───

export const ExecutionCapabilitiesSchema = z.object({
  task_execution: z.boolean().default(false),
  worker_discovery: z.boolean().default(false),
  escrow: z.boolean().default(false),
  collateral: z.boolean().default(false),
  verification: z.boolean().default(false),
  arbitration: z.boolean().default(false),
  agent_messaging: z.boolean().default(false),
  programmable_splits: z.boolean().default(false),
  fiat_settlement: z.boolean().default(false),
  crypto_settlement: z.boolean().default(false),
})

export const ExecutionAuthoritySchema = z.object({
  inspect: z.boolean().default(false),
  test: z.boolean().default(false),
  modify: z.boolean().default(false),
  deploy: z.boolean().default(false),
  access_scope: z.array(z.string().trim().max(500)).max(50).default([]),
})

export const ExecutionRequestSchema = z.object({
  execution_id: z.string().min(3).max(100),
  contribution_id: z.string().min(3).max(100),
  source_commitment_hash: z.string().min(10).max(500),
  task: z.object({
    title: z.string().trim().min(3).max(300),
    description: z.string().trim().min(10).max(20_000),
    deliverables: z.array(z.string().trim().min(1).max(2000)).min(1).max(50),
    acceptance_criteria: z.array(z.string().trim().min(1).max(2000)).min(1).max(50),
  }),
  budget: z.object({
    amount: z.number().nonnegative().max(10_000_000),
    currency: z.string().length(3).transform(v => v.toUpperCase()),
    maximum: z.number().nonnegative().max(10_000_000).optional(),
  }).optional(),
  authority: ExecutionAuthoritySchema,
  verification: z.object({
    criteria: z.array(z.string().trim().min(1).max(1000)).min(1).max(50),
    evidence_required: z.array(z.string().trim().min(1).max(1000)).max(50).default([]),
  }),
  deadline: z.string().datetime().optional(),
  provenance: z.object({
    originator: z.string().min(1).max(500),
    contribution_lineage: z.array(z.string().max(1000)).max(100).default([]),
  }),
})

export const ExecutionReferenceSchema = z.object({
  execution_id: z.string().min(3).max(100),
  provider: z.string().min(1).max(200),
  provider_reference: z.string().min(1).max(500),
  created_at: z.string().datetime(),
})

export const ExecutionReceiptSchema = z.object({
  execution_reference: ExecutionReferenceSchema,
  provider: z.string().min(1).max(200),
  provider_reference: z.string().min(1).max(500),
  status: z.enum(['delivered', 'verified', 'failed', 'cancelled', 'disputed']),
  executor: z.object({
    id: z.string().min(1).max(500),
    identity: z.string().max(500).optional(),
    role: z.string().min(1).max(200),
  }),
  artifact: z.object({
    uri: z.string().max(2000),
    hash: z.string().min(8).max(500),
  }).optional(),
  verification: z.object({
    status: z.enum(['pending', 'verified', 'failed']),
    evidence: z.array(z.string().max(2000)).max(100).default([]),
  }).optional(),
  settlement: z.object({
    status: z.enum(['pending', 'settled', 'failed']),
    amount: z.number().nonnegative().max(10_000_000).optional(),
    currency: z.string().length(3).optional(),
    receipt: z.string().max(2000).optional(),
  }).optional(),
  timestamps: z.object({
    created: z.string().datetime(),
    started: z.string().datetime().optional(),
    delivered: z.string().datetime().optional(),
    verified: z.string().datetime().optional(),
    settled: z.string().datetime().optional(),
  }),
  provider_metadata: z.object({
    reference: z.string().max(500),
  }).catchall(z.unknown()).optional(),
})

export const CreateExecutionSchema = z.object({
  provider_id: z.string().trim().min(1).max(200).optional(),
  mode: z.enum(['no_execution_required', 'self_executed', 'direct_agent', 'external_provider', 'human']).optional(),
  task_title: z.string().trim().min(3).max(300).optional(),
  task_description: z.string().trim().min(10).max(20_000).optional(),
  deliverables: z.array(z.string().trim().min(1).max(2000)).max(50).optional(),
  acceptance_criteria: z.array(z.string().trim().min(1).max(2000)).max(50).optional(),
  budget_amount: z.number().nonnegative().max(10_000_000).optional(),
  budget_currency: z.string().length(3).optional(),
  deadline: z.string().datetime().optional(),
})

export const SubmitReceiptSchema = z.object({
  receipt: ExecutionReceiptSchema,
  provider_event_id: z.string().trim().min(1).max(200).optional(),
  provider_event_timestamp: z.string().datetime().optional(),
  nonce: z.string().trim().min(1).max(200).optional(),
})
