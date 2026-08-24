import { NextRequest, NextResponse } from 'next/server'
import { ExchangePolicyUpdateSchema } from '@/exchange-gateway/src/schema'
import { mergeExchangePolicy } from '@/exchange-gateway/src/policy'
import { authenticateCompany, findCompany, getExchangeAdmin, hashSecret, newSecret, normalizeDomain } from '@/lib/exchange/server'

export async function GET(req:NextRequest){
  const domain=normalizeDomain(req.nextUrl.searchParams.get('domain')||'')
  if(!domain||!(await authenticateCompany(domain,req.headers.get('x-exchange-company-key')))) return NextResponse.json({error:'Unauthorized'},{status:401})
  const company=await findCompany(domain)
  if(!company) return NextResponse.json({error:'Company not found'},{status:404})
  const admin=getExchangeAdmin()
  const {data:activity}=await admin.from('exchange_records').select('id,public_id,kind,state,title,steward_status,escalation_required,escalation_reasons,proposed_consideration,created_at,updated_at').eq('company_id',company.id).order('created_at',{ascending:false}).limit(50)
  const exchanges=activity||[]
  const ids=exchanges.map((x:{id:string})=>x.id)
  const settlements=ids.length?(await admin.from('exchange_settlements').select('exchange_id,gross_cents,platform_fee_cents,status,currency,settled_at').in('exchange_id',ids)).data||[]:[]
  const settled=settlements.filter((s:{status:string})=>s.status==='settled')
  return NextResponse.json({
    company:{domain:company.domain,legal_name:company.legal_name,agent_mode:company.agent_mode,exchange_agent_endpoint:company.exchange_agent_endpoint,transaction_enabled:company.transaction_enabled,policy:mergeExchangePolicy(company.exchange_policy,company.categories||[])},
    escalations:exchanges.filter((x:{escalation_required:boolean})=>x.escalation_required),
    activity:exchanges,
    economics:{settled_count:settled.length,gross_cents:settled.reduce((n:number,s:{gross_cents:number})=>n+Number(s.gross_cents||0),0),platform_fee_cents:settled.reduce((n:number,s:{platform_fee_cents:number})=>n+Number(s.platform_fee_cents||0),0),settlements},
  })
}

export async function POST(req:NextRequest){
  const raw=await req.json().catch(()=>null)
  const parsed=ExchangePolicyUpdateSchema.safeParse(raw)
  if(!parsed.success) return NextResponse.json({error:'Invalid policy update',details:parsed.error.flatten()},{status:400})
  const p=parsed.data
  if(!(await authenticateCompany(p.domain,req.headers.get('x-exchange-company-key')))) return NextResponse.json({error:'Unauthorized'},{status:401})
  if(p.agentMode==='bring_your_own'&&!p.exchangeAgentEndpoint) return NextResponse.json({error:'Bring-your-own-agent mode requires an agent endpoint'},{status:400})
  const company=await findCompany(p.domain)
  if(!company) return NextResponse.json({error:'Company not found'},{status:404})
  const policy=mergeExchangePolicy(company.exchange_policy,company.categories||[])
  policy.auto_engage.enabled=p.autoEngageEnabled
  policy.auto_engage.max_cash=p.autoEngageMaxCash
  policy.auto_engage.allowed_categories=p.allowedCategories
  policy.human_required_for_commitment=p.humanRequiredForCommitment
  policy.human_required_for_execution=p.humanRequiredForExecution
  const update:Record<string,unknown>={agent_mode:p.agentMode,exchange_agent_endpoint:p.exchangeAgentEndpoint||null,exchange_policy:policy,updated_at:new Date().toISOString()}
  let domainAgentKey:string|undefined
  if(raw?.rotateDomainAgentKey===true){domainAgentKey=newSecret('domain_agent');update.domain_agent_key_hash=hashSecret(domainAgentKey)}
  const admin=getExchangeAdmin()
  const {error}=await admin.from('exchange_companies').update(update).eq('id',company.id)
  if(error) return NextResponse.json({error:'Policy update failed'},{status:500})
  return NextResponse.json({saved:true,domain:p.domain,agent_mode:p.agentMode,policy,domain_agent_key:domainAgentKey,warning:domainAgentKey?'Save the rotated domain-agent key now; only its hash is stored.':undefined})
}
