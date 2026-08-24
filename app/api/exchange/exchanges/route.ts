import { NextRequest, NextResponse } from 'next/server'
import { authenticateCompany, authenticateDomainAgent, getExchangeAdmin, normalizeDomain } from '@/lib/exchange/server'
export async function GET(req:NextRequest){
  const domain=normalizeDomain(req.nextUrl.searchParams.get('domain')||'')
  const company=await authenticateCompany(domain,req.headers.get('x-exchange-company-key'))
  const domainAgent=await authenticateDomainAgent(domain,req.headers.get('x-exchange-domain-agent-key'))
  if(!domain||(!company&&!domainAgent)) return NextResponse.json({error:'Unauthorized'},{status:401})
  const admin=getExchangeAdmin()
  const {data,error}=await admin.from('exchange_records').select('public_id,kind,state,title,initiator_identity,proposal_detail,proposed_consideration,steward_status,escalation_required,escalation_reasons,created_at,updated_at').eq('target_domain',domain).order('created_at',{ascending:false}).limit(100)
  if(error) return NextResponse.json({error:'Exchange feed unavailable'},{status:500})
  return NextResponse.json({domain,actor:domainAgent?'domain_agent':'company_admin',exchanges:data})
}
