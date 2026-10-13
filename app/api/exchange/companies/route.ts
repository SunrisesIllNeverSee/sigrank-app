import { NextRequest, NextResponse } from 'next/server'
import { CompanyRegistrationSchema } from '@/lib/exchange-gateway/src/schema'
import { defaultExchangePolicy } from '@/lib/exchange-gateway/src/policy'
import { getExchangeAdmin, hashSecret, newSecret, normalizeDomain, referenceDomain, requestIdentity } from '@/lib/exchange/server'
import { rateLimitAllowAsync } from '@/lib/exchange/rate-limit'
import { isProhibitedHost } from '@/lib/exchange/mcp-tools'

export async function POST(req: NextRequest){
  if(!(await rateLimitAllowAsync(requestIdentity(req),'exchange_company_signup'))) return NextResponse.json({error:'Rate limited'},{status:429})
  const parsed = CompanyRegistrationSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success) return NextResponse.json({error:'Invalid company registration',details:parsed.error.flatten()},{status:400})
  const p=parsed.data
  if(p.honeypot) return NextResponse.json({error:'Rejected'},{status:400})
  if(p.agentMode==='bring_your_own'&&!p.exchangeAgentEndpoint) return NextResponse.json({error:'Bring-your-own-agent mode requires an HTTPS agent endpoint'},{status:400})
  if(p.exchangeAgentEndpoint){try{const u=new URL(p.exchangeAgentEndpoint);if(isProhibitedHost(u.hostname))return NextResponse.json({error:'Agent endpoint must not point to private/loopback/metadata hosts'},{status:400})}catch{return NextResponse.json({error:'Agent endpoint must be a valid URL'},{status:400})}}
  const admin=getExchangeAdmin()
  const domain=normalizeDomain(p.domain)
  if(domain===referenceDomain()) return NextResponse.json({error:'Domain is reserved'},{status:409})
  const {data:existing}=await admin.from('exchange_companies').select('id,verification_status,created_at').eq('domain',domain).maybeSingle()
  const STALE_MS=7*24*60*60*1000
  const reclaimable=!!existing&&existing.verification_status==='pending'&&Date.now()-new Date(existing.created_at).getTime()>STALE_MS
  if(existing&&!reclaimable) return NextResponse.json({error:'Domain already registered',status:existing.verification_status},{status:409})

  const companyKey=newSecret('company')
  const domainAgentKey=newSecret('domain_agent')
  const verificationToken=newSecret('verify')
  const row={
    legal_name:p.legalName,domain,contact_name:p.contactName,contact_email:p.contactEmail,country:p.country,
    address:{addressLine1:p.addressLine1,city:p.city,region:p.region,postalCode:p.postalCode},
    verification_token:verificationToken,admin_key_hash:hashSecret(companyKey),domain_agent_key_hash:hashSecret(domainAgentKey),
    accepts_unsolicited:p.acceptsUnsolicited,accepts_requests:p.acceptsRequests,categories:p.categories,
    agent_mode:p.agentMode,exchange_agent_endpoint:p.exchangeAgentEndpoint||null,exchange_policy:defaultExchangePolicy(p.categories),transaction_enabled:false,
  }
  const cols='id,domain,verification_status,agent_mode,transaction_enabled'
  // Stale unverified registrations (>7d) may be re-claimed: replace credentials and reset to unverified.
  const {data,error}=existing
    ? await admin.from('exchange_companies').update({...row,verification_status:'pending',verified_at:null,updated_at:new Date().toISOString()}).eq('id',existing.id).eq('verification_status','pending').select(cols).single()
    : await admin.from('exchange_companies').insert(row).select(cols).single()
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
