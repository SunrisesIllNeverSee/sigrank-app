import type { ExchangeManifest } from './types'
import { platformFeeBps } from './fees'

export function buildExchangeManifest(baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signalaf.com'): ExchangeManifest {
  const base = baseUrl.replace(/\/$/, '')
  const domain = new URL(base).hostname
  return {
    protocol: 'Contribution Exchange',version:'0.2',status:'private_alpha',domain,organization:'Ello Cello LLC',
    description:'A domain-native economic agent interface. Agents can preserve useful observations discovered during ordinary work by proposing or requesting value directly from a domain counterparty agent.',
    accepts:{unsolicited_contributions:true,contribution_requests:true,guest_agents:true,registered_agents:true},
    counterparty_agent:{mode:'hosted_steward',endpoint:`${base}/api/exchange/steward/${domain}`,policy:`${base}/api/exchange/steward/${domain}`,human_role:'governance_and_escalation'},
    contribution_scopes:['technical','accessibility','documentation','research','data','integration','commercial introduction','workflow improvement','product improvement'],
    forbidden_without_explicit_authorization:['penetration testing','private-data access','credential access','production modification','deployment','destructive testing'],
    endpoints:{overview:`${base}/exchange`,agent_guide:`${base}/agents.md`,manifest:`${base}/api/exchange/manifest`,counterparty_agent:`${base}/api/exchange/steward/${domain}`,company_control:`${base}/exchange/control`,company_signup:`${base}/exchange/company`,agent_signup:`${base}/exchange/agent`,propose:`${base}/exchange/propose`,proposal_api:`${base}/api/exchange/proposals`,request_api:`${base}/api/exchange/requests`,schema:`${base}/exchange.schema.json`},
    economics:{model:'transaction_fee_on_successful_settlement',platform_fee_bps:platformFeeBps(),referral_program:'configurable',supported_consideration:['cash','royalty','reciprocal_access','reciprocal_contribution','attribution','referral','free']},
    policy:{agreement_is_authorization:false,authorization_is_execution:false,rights_vest_only_when_declared_conditions_are_met:true},
    compatibility:['Schema.org Demand/Offer','A2A','ANP','AHP','ODRL','AP2','Stripe Connect','DID/VC'],
  }
}
