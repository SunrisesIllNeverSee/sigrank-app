import { NextRequest, NextResponse } from 'next/server'
import { CompanyRegistrationSchema } from '@/exchange-gateway/src/schema'
import { defaultExchangePolicy } from '@/exchange-gateway/src/policy'
import { getExchangeAdmin, hashSecret, newSecret, normalizeDomain, requestIdentity } from '@/lib/exchange/server'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'

export async function POST(req: NextRequest){
  if(!rateLimitAllow(requestIdentity(req),'exchange_company_signup')) return NextResponse.json({error:'Rate limited'},{status:429})
  const parsed = CompanyRegistrationSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success) return NextResponse.json({error:'Invalid company registration',details:parsed.error.flatten()},{status:400})
  const p=parsed.data
  if(p.honeypot) return NextResponse.json({error:'Rejected'},{status:400})
  if(p.agentMode==='bring_your_own'&&!p.exchangeAgentEndpoint) return NextResponse.json({error:'Bring-your-own-agent mode requires an HTTPS agent endpoint'},{status:400})
  const admin=getExchangeAdmin()
  const domain=normalizeDomain(p.domain)
  const {data:existing}=await admin.from('exchange_companies').select('id,verification_status').eq('domain',domain).maybeSingle()
  if(existing) return NextResponse.json({error:'Domain already registered',status:existing.verification_status},{status:409})

  const companyKey=newSecret('company')
  const domainAgentKey=newSecret('domain_agent')
  const verificationToken=newSecret('verify')
  const {data,error}=await admin.from('exchange_companies').insert({
    legal_name:p.legalName,domain,contact_name:p.contactName,contact_email:p.contactEmail,country:p.country,
    address:{addressLine1:p.addressLine1,city:p.city,region:p.region,postalCode:p.postalCode},
    verification_token:verificationToken,admin_key_hash:hashSecret(companyKey),domain_agent_key_hash:hashSecret(domainAgentKey),
    accepts_unsolicited:p.acceptsUnsolicited,accepts_requests:p.acceptsRequests,categories:p.categories,
    agent_mode:p.agentMode,exchange_agent_endpoint:p.exchangeAgentEndpoint||null,exchange_policy:defaultExchangePolicy(p.categories),transaction_enabled:false,
  }).select('id,domain,verification_status,agent_mode,transaction_enabled').single()
  if(error) return NextResponse.json({error:'Registration failed'},{status:500})
  return NextResponse.json({
    company:data,
    company_admin_key:companyKey,
    domain_agent_key:domainAgentKey,
    warning:'Save both keys now. Only hashes are stored. Human administrators and domain agents intentionally use different credentials.',
    dns:{name:`_contribution-exchange.${domain}`,type:'TXT',value:`cx-verification=${verificationToken}`},
    activation:'Domain verification enables participation. New financial settlement remains private-alpha gated until transaction_enabled is activated by the operator.',
  }, {status:201})
}
