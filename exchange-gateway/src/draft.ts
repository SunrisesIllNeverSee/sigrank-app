import type { Consideration, ContributionCommitment, ProposalAuthority } from './types'

type DraftRecord = {
  public_id: string
  target_domain: string
  kind: string
  title: string
  initiator_identity?: Record<string, unknown> | null
  proposed_consideration?: unknown
  proposal_detail?: Record<string, unknown> | null
  observation?: string | null
  desired_outcome?: string | null
  proposed_contribution?: string | null
  requested_contribution?: string | null
}

type DraftDetail = {
  required_authorization?: Partial<ProposalAuthority>
  verification?: { criteria?: string[] }
}

export function buildCommitmentDraft(record: DraftRecord): ContributionCommitment {
  const initiator = record.initiator_identity ?? {}
  const domain = { type: 'domain' as const, id: `https://${record.target_domain}`, url: `https://${record.target_domain}` }
  const agent = {
    type: 'agent' as const,
    id: String(initiator.id || initiator.did || `agent:${record.public_id}`),
    displayName: typeof initiator.displayName === 'string' ? initiator.displayName : undefined,
    did: typeof initiator.did === 'string' ? initiator.did : undefined,
    email: typeof initiator.email === 'string' ? initiator.email : undefined,
  }
  const isRequest = record.kind === 'contribution_request'
  const contributor = isRequest ? domain : agent
  const recipient = isRequest ? agent : domain
  const consideration = (Array.isArray(record.proposed_consideration) ? record.proposed_consideration : []) as Consideration[]
  const hasCash = consideration.some((item) => item.type === 'cash')
  const detail = (record.proposal_detail ?? {}) as DraftDetail
  const requested = detail.required_authorization ?? { inspect_public: true }
  const accessScope = [
    'public_information',
    ...(requested.repository_read ? ['repository_read'] : []),
    ...(requested.repository_write ? ['repository_write'] : []),
    ...(requested.private_data ? ['private_data'] : []),
    ...(requested.credential_access ? ['credential_access'] : []),
    ...(requested.production_modify ? ['production_modify'] : []),
  ]
  const verificationCriteria = detail.verification?.criteria?.length
    ? detail.verification.criteria
    : ['Recipient acceptance against the committed contribution']

  return {
    version: '0.1',
    contribution_id: record.public_id,
    origin: {
      type: isRequest ? 'direct_request' : 'ambient_observation',
      observed_at: `https://${record.target_domain}`,
      description: record.observation || record.desired_outcome || undefined,
    },
    parties: { contributor, recipient },
    contribution: {
      type: isRequest ? 'requested_contribution' : 'agent_originated_contribution',
      title: record.title,
      description: record.proposed_contribution || record.requested_contribution || record.title,
      disclosure_state: 'evaluation',
    },
    consideration,
    rights: {
      owner: String(contributor.id),
      pre_vesting: { license: 'evaluation_only', deploy: 'prohibited', derivative_use: 'prohibited' },
      post_vesting: { license: 'commercial_nonexclusive', deploy: 'permitted', derivative_use: 'permitted' },
      attribution_required: true,
    },
    vesting: { requires: hasCash ? ['authorization', 'delivery', 'verification', 'settlement'] : ['authorization', 'delivery', 'verification'] },
    authorization: {
      inspect: requested.inspect_public !== false,
      test: !!requested.sandbox_test,
      modify: !!requested.repository_write || !!requested.production_modify,
      deploy: !!requested.deploy,
      access_scope: accessScope,
    },
    verification: { criteria: verificationCriteria },
    settlement: { status: hasCash ? 'pending' : 'not_required', mechanism: hasCash ? 'stripe_connect_or_operator_resolution' : 'nonfinancial', escrow: false },
    revocation: { authorization: 'revocable', access: 'revocable', license_pre_vesting: 'withdrawable', license_post_vesting: 'breach_only', artifact_recall: 'not_guaranteed' },
    provenance: { attribution_required: true },
  }
}
