import { NextRequest, NextResponse } from 'next/server'
import { authenticateCompany, authenticateDomainAgent, authenticateProposer, getExchangeAdmin } from '@/lib/exchange/server'
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const publicId=(await params).id
  const admin=getExchangeAdmin()
  const {data:record,error}=await admin.from('exchange_records').select('*').eq('public_id',publicId).maybeSingle()
  if(error||!record) return NextResponse.json({error:'Exchange not found'},{status:404})
  const proposer=authenticateProposer(record,req.headers.get('x-exchange-proposer-key'))
  const company=await authenticateCompany(record.target_domain,req.headers.get('x-exchange-company-key'))
  const domainAgent=await authenticateDomainAgent(record.target_domain,req.headers.get('x-exchange-domain-agent-key'))
  if(!proposer&&!company&&!domainAgent) return NextResponse.json({error:'Unauthorized'},{status:401})
  const {data:events}=await admin.from('exchange_events').select('event_type,actor,from_state,to_state,payload,created_at').eq('exchange_id',record.id).order('created_at',{ascending:true})
  const {data:settlement}=await admin.from('exchange_settlements').select('*').eq('exchange_id',record.id).maybeSingle()
  const safe={...record,proposer_key_hash:undefined,company_id:undefined}
  return NextResponse.json({actor:proposer?'proposer':domainAgent?'domain_agent':'company_admin',exchange:safe,events:events??[],settlement})
}
