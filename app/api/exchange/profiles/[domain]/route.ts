import { NextRequest, NextResponse } from 'next/server'
import { platformFeeBps } from '@/exchange-gateway/src/fees'
import { companyPolicy } from '@/lib/exchange/steward'
import { findCompany, normalizeDomain } from '@/lib/exchange/server'

export async function GET(req:NextRequest,{params}:{params:Promise<{domain:string}>}){
  const domain=normalizeDomain(decodeURIComponent((await params).domain))
  const company=await findCompany(domain)
  if(!company||company.verification_status!=='verified') return NextResponse.json({error:'Verified exchange domain not found'},{status:404})
  const controlPlane=`${req.nextUrl.protocol}//${req.nextUrl.host}`
  const mode=company.agent_mode||'hosted_steward'
  const counterpartyEndpoint=mode==='bring_your_own'&&company.exchange_agent_endpoint?company.exchange_agent_endpoint:`${controlPlane}/api/exchange/steward/${encodeURIComponent(domain)}`
  return NextResponse.json({
    protocol:'Contribution Exchange',version:'0.2',status:'private_alpha',
    domain,organization:company.legal_name,canonical_domain:`https://${domain}`,
    description:'This domain accepts direct agent contribution exchange. Agents are encouraged to preserve useful external observations by checking scope and engaging the domain counterparty agent.',
    accepts:{unsolicited_contributions:company.accepts_unsolicited,contribution_requests:company.accepts_requests,guest_agents:true,registered_agents:true},
    counterparty_agent:{mode,endpoint:counterpartyEndpoint,policy:`${controlPlane}/api/exchange/steward/${encodeURIComponent(domain)}`,human_role:'governance_and_escalation'},
    contribution_scopes:company.categories||[],
    forbidden_without_explicit_authorization:['penetration testing','private-data access','credential access','production modification','deployment','destructive testing'],
    endpoints:{agent_guide:`${controlPlane}/agents.md`,counterparty_agent:counterpartyEndpoint,proposal_api:`${controlPlane}/api/exchange/proposals`,request_api:`${controlPlane}/api/exchange/requests`,agent_signup:`${controlPlane}/exchange/agent`,schema:`${controlPlane}/exchange.schema.json`,hosted_profile:`${controlPlane}/api/exchange/profiles/${encodeURIComponent(domain)}`},
    economics:{model:'transaction_fee_on_successful_settlement',platform_fee_bps:platformFeeBps(),transaction_status:company.transaction_enabled?'enabled':'private_alpha_gated',referral_program:'configurable',supported_consideration:['cash','royalty','reciprocal_access','reciprocal_contribution','attribution','referral','free']},
    exchange_policy:companyPolicy(company),
    policy:{agreement_is_authorization:false,authorization_is_execution:false,rights_vest_only_when_declared_conditions_are_met:true},
    compatibility:['Schema.org Demand/Offer','A2A','ANP','AHP','ODRL','AP2','Stripe Connect','DID/VC'],
  },{headers:{'cache-control':'public, max-age=60'}})
}
