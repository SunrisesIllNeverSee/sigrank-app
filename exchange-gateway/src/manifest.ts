import type { ExchangeManifest } from './types'
import { platformFeeBps } from './fees'
import { allProviderCapabilities } from './execution-router'

type HostAwareExchangeManifest = ExchangeManifest & {
  capability: 'contribution_exchange'
  host: {
    name: string
    url: string
    primary_product: string
  }
  purpose: string
  activation: {
    mode: 'explicit_request'
    default_site_representation: 'host_content'
    user_agent_detection_does_not_activate: true
  }
}

export function buildExchangeManifest(baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://signalaf.com'): HostAwareExchangeManifest {
  const base = baseUrl.replace(/\/$/, '')
  const domain = new URL(base).hostname
  return {
    protocol: 'Contribution Exchange',version:'0.2',status:'private_alpha',domain,organization:'Ello Cello LLC',
    capability:'contribution_exchange',
    host:{name:'SignalAF / SigRank',url:base,primary_product:'AI operator measurement and public benchmark'},
    purpose:'Optional economic interaction capability provided by SignalAF. It is not the host site or primary product identity.',
    activation:{mode:'explicit_request',default_site_representation:'host_content',user_agent_detection_does_not_activate:true},
    description:'An optional SignalAF capability for domain-native economic interaction. Agents may explicitly use the Exchange endpoints to preserve useful observations by proposing or requesting value. Ordinary site and agent requests remain SignalAF / SigRank interactions.',
    accepts:{unsolicited_contributions:true,contribution_requests:true,guest_agents:true,registered_agents:true},
    counterparty_agent:{mode:'hosted_steward',endpoint:`${base}/api/exchange/steward/${domain}`,policy:`${base}/api/exchange/steward/${domain}`,human_role:'governance_and_escalation'},
    contribution_scopes:['technical','accessibility','documentation','research','data','integration','commercial introduction','workflow improvement','product improvement'],
    forbidden_without_explicit_authorization:['penetration testing','private-data access','credential access','production modification','deployment','destructive testing'],
    endpoints:{host_home:base,primary_product:base,overview:`${base}/exchange`,agent_guide:`${base}/agents.md`,manifest:`${base}/api/exchange/manifest`,counterparty_agent:`${base}/api/exchange/steward/${domain}`,company_control:`${base}/exchange/control`,company_signup:`${base}/exchange/company`,agent_signup:`${base}/exchange/agent`,propose:`${base}/exchange/propose`,proposal_api:`${base}/api/exchange/proposals`,request_api:`${base}/api/exchange/requests`,execute:`${base}/api/exchange/exchanges`,schema:`${base}/exchange.schema.json`},
    economics:{model:'transaction_fee_on_successful_settlement',platform_fee_bps:platformFeeBps(),referral_program:'configurable',supported_consideration:['cash','royalty','reciprocal_access','reciprocal_contribution','attribution','referral','free']},
    policy:{agreement_is_authorization:false,authorization_is_execution:false,rights_vest_only_when_declared_conditions_are_met:true},
    compatibility:['Schema.org Demand/Offer','A2A','ANP','AHP','ODRL','AP2','Stripe Connect','DID/VC'],
    execution:{
      modes:['no_execution_required','self_executed','direct_agent','external_provider','human'],
      providers:allProviderCapabilities().map(p=>({id:p.id,capabilities:p.capabilities})),
    },
    signals:{
      schema:`${base}/schemas/exchange-signal/1.0`,
      collection:`${base}/api/exchange/signals`,
      human:`${base}/exchange/signals`,
      authentication:`${base}/agents.md#signal-authentication`,
      supported_types:['problem','request','challenge','bounty','verification','discovery','experiment'],
    },
    mcp:{
      server_name:'contribution-exchange',
      endpoint:`${base}/api/exchange/mcp`,
      server_card:`${base}/.well-known/exchange-mcp.json`,
      transport:'streamable-http',
    },
  }
}
