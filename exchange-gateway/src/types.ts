export type ExchangeKind = 'contribution_proposal' | 'contribution_request'

export type ExchangeState =
  | 'observed'
  | 'proposed'
  | 'engaged'
  | 'negotiating'
  | 'committed'
  | 'authorized'
  | 'delivering'
  | 'delivered'
  | 'verified'
  | 'settled'
  | 'closed'
  | 'declined'
  | 'expired'
  | 'disputed'
  | 'revoked'

export type ActorType = 'domain' | 'organization' | 'agent' | 'human' | 'system'

export interface ActorRef {
  type: ActorType
  id: string
  displayName?: string
  url?: string
  did?: string
  email?: string
}

export type Consideration =
  | { type: 'cash'; amount: number; currency: string }
  | { type: 'royalty'; rate: number; basis: string; duration?: string }
  | { type: 'reciprocal_access'; asset: string; scope?: string }
  | { type: 'reciprocal_contribution'; description: string }
  | { type: 'attribution'; lineageCredit: boolean; display?: string }
  | { type: 'referral'; rate?: number; basis?: string }
  | { type: 'other'; description: string }

export interface ProposalAuthority {
  inspect_public: boolean
  sandbox_test: boolean
  repository_read: boolean
  repository_write: boolean
  private_data: boolean
  credential_access: boolean
  production_modify: boolean
  deploy: boolean
  penetration_testing: boolean
  other?: string[]
}

export interface ProposalDetail {
  category: string
  confidence?: { score: number; basis?: string }
  impact?: { expected_change: string; assumptions?: string[] }
  required_authorization: ProposalAuthority
  verification?: { method: string; criteria: string[] }
  effort?: { agent_minutes?: number; human_minutes?: number; elapsed_hours?: number }
}

export interface ExchangePolicy {
  version: '0.2'
  auto_engage: {
    enabled: boolean
    max_cash: number
    allowed_categories: string[]
    allowed_consideration: Array<Consideration['type']>
  }
  escalation: {
    royalty: boolean
    reciprocal_access: boolean
    repository_write: boolean
    private_data: boolean
    credential_access: boolean
    production_modify: boolean
    deploy: boolean
    penetration_testing: boolean
  }
  authority_ceiling: ProposalAuthority
  human_required_for_commitment: boolean
  human_required_for_execution: boolean
  external_execution?: {
    enabled: boolean
    allowed_providers: string[]
    autonomous_task_creation: boolean
    autonomous_escrow_funding: boolean
    max_autonomous_budget: number
    human_approval_above: number
    allowed_authority: ExecutionAuthority
  }
}

export type DomainAgentMode = 'hosted_steward' | 'bring_your_own' | 'passive'

export interface StewardDecision {
  disposition: 'engage' | 'escalate'
  reasons: string[]
  response: string
  human_required: boolean
}

export interface ContributionCommitment {
  version: '0.1'
  contribution_id: string
  origin: {
    type: 'ambient_observation' | 'published_need' | 'published_offer' | 'direct_request' | 'other'
    observed_at?: string
    description?: string
  }
  parties: {
    contributor: ActorRef
    recipient: ActorRef
  }
  contribution: {
    type: string
    title: string
    description: string
    disclosure_state: 'protected' | 'evaluation' | 'authorized' | 'released'
    artifact?: {
      kind?: string
      hash?: string
      uri?: string
      lineage?: string[]
      custody?: 'contributor' | 'recipient' | 'escrow' | 'shared' | 'none'
    }
  }
  consideration: Consideration[]
  rights: {
    owner: string
    pre_vesting: {
      license: string
      deploy: 'prohibited' | 'permitted'
      derivative_use?: 'prohibited' | 'permitted'
    }
    post_vesting: {
      license: string
      deploy: 'prohibited' | 'permitted'
      derivative_use?: 'prohibited' | 'permitted'
    }
    attribution_required?: boolean
  }
  vesting: {
    requires: Array<'authorization' | 'delivery' | 'verification' | 'settlement' | 'other'>
    other_conditions?: string[]
  }
  authorization: {
    inspect: boolean
    test: boolean
    modify: boolean
    deploy: boolean
    access_scope?: string[]
  }
  verification: {
    criteria: string[]
    verifier?: ActorRef
    evidence?: string[]
  }
  settlement: {
    status: 'not_required' | 'pending' | 'awaiting_payment' | 'manual_required' | 'settled' | 'failed'
    mechanism?: string
    escrow?: boolean
  }
  revocation: {
    authorization: 'revocable' | 'irrevocable' | 'not_applicable'
    access: 'revocable' | 'irrevocable' | 'not_applicable'
    license_pre_vesting: 'withdrawable' | 'nonwithdrawable' | 'not_applicable'
    license_post_vesting: 'breach_only' | 'nonrevocable' | 'revocable' | 'not_applicable'
    artifact_recall: 'not_guaranteed' | 'supported'
  }
  provenance: {
    terms_hash?: string
    parent?: string
    descendants?: string[]
    attribution_required?: boolean
  }
}

export interface ExchangeManifest {
  protocol: string
  version: '0.2'
  status: 'private_alpha' | 'active'
  domain: string
  organization: string
  description: string
  accepts: {
    unsolicited_contributions: boolean
    contribution_requests: boolean
    guest_agents: boolean
    registered_agents: boolean
  }
  counterparty_agent: {
    mode: DomainAgentMode
    endpoint: string
    policy: string
    human_role: 'governance_and_escalation'
  }
  contribution_scopes: string[]
  forbidden_without_explicit_authorization: string[]
  endpoints: Record<string, string>
  economics: {
    model: 'transaction_fee_on_successful_settlement'
    platform_fee_bps: number
    referral_program: 'configurable'
    supported_consideration: string[]
  }
  policy: {
    agreement_is_authorization: false
    authorization_is_execution: false
    rights_vest_only_when_declared_conditions_are_met: true
  }
  compatibility: string[]
  execution?: {
    modes: ExecutionMode[]
    providers: Array<{
      id: string
      capabilities: ExecutionCapabilities
    }>
  }
  signals?: {
    schema: string
    collection: string
    human: string
    authentication: string
    supported_types: string[]
  }
  mcp?: {
    server_name: string
    endpoint: string
    server_card: string
    transport: 'streamable-http'
  }
}

// ─── Execution Provider Layer ───

export type ExecutionMode =
  | 'no_execution_required'
  | 'self_executed'
  | 'direct_agent'
  | 'external_provider'
  | 'human'

export type ExecutionState =
  | 'created'
  | 'offered'
  | 'accepted'
  | 'funded'
  | 'executing'
  | 'delivered'
  | 'verified'
  | 'settled'
  | 'failed'
  | 'cancelled'
  | 'disputed'
  | 'expired'

export interface ExecutionCapabilities {
  task_execution: boolean
  worker_discovery: boolean
  escrow: boolean
  collateral: boolean
  verification: boolean
  arbitration: boolean
  agent_messaging: boolean
  programmable_splits: boolean
  fiat_settlement: boolean
  crypto_settlement: boolean
}

export interface ExecutionAuthority {
  inspect: boolean
  test: boolean
  modify: boolean
  deploy: boolean
  access_scope: string[]
}

export interface ExecutionRequest {
  execution_id: string
  contribution_id: string
  source_commitment_hash: string
  task: {
    title: string
    description: string
    deliverables: string[]
    acceptance_criteria: string[]
  }
  budget?: {
    amount: number
    currency: string
    maximum?: number
  }
  authority: ExecutionAuthority
  verification: {
    criteria: string[]
    evidence_required: string[]
  }
  deadline?: string
  provenance: {
    originator: string
    contribution_lineage: string[]
  }
}

export interface ExecutionReference {
  execution_id: string
  provider: string
  provider_reference: string
  created_at: string
}

export interface ExecutionStatus {
  reference: ExecutionReference
  state: ExecutionState
  updated_at: string
  provider_state?: string
  message?: string
}

export interface ExecutionReceipt {
  execution_reference: ExecutionReference
  provider: string
  provider_reference: string
  status: 'delivered' | 'verified' | 'failed' | 'cancelled' | 'disputed'
  executor: {
    id: string
    identity?: string
    role: string
  }
  artifact?: {
    uri: string
    hash: string
  }
  verification?: {
    status: 'pending' | 'verified' | 'failed'
    evidence: string[]
  }
  settlement?: {
    status: 'pending' | 'settled' | 'failed'
    amount?: number
    currency?: string
    receipt?: string
  }
  timestamps: {
    created: string
    started?: string
    delivered?: string
    verified?: string
    settled?: string
  }
  provider_metadata?: {
    reference: string
    [key: string]: unknown
  }
}

export interface ExecutionAssessment {
  can_execute: boolean
  reasons: string[]
  estimated_cost?: { amount: number; currency: string }
  estimated_duration?: string
}

export interface ExecutionProvider {
  id: string
  capabilities(): ExecutionCapabilities
  canExecute(commitment: ContributionCommitment, request: ExecutionRequest): Promise<ExecutionAssessment>
  createExecution(request: ExecutionRequest): Promise<ExecutionReference>
  getExecution(reference: ExecutionReference): Promise<ExecutionStatus>
  cancelExecution?(reference: ExecutionReference): Promise<void>
  verifyExecution?(reference: ExecutionReference): Promise<ExecutionReceipt>
}

export interface ExecutionRouterResult {
  mode: ExecutionMode
  provider_id?: string
  reference?: ExecutionReference
  assessment?: ExecutionAssessment
  reason: string
}
