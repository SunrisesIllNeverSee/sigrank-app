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
}
