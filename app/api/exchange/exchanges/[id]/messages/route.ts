import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { appendExchangeEvent, authenticateCompany, authenticateDomainAgent, authenticateProposer, findCompany, getExchangeAdmin, requestIdentity } from '@/lib/exchange/server'
import { notifyDomainAgent } from '@/lib/exchange/steward'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'
const MessageSchema=z.object({text:z.string().trim().min(1).max(10000)})
const controlBase=process.env.NEXT_PUBLIC_SITE_URL??'https://signalaf.com'

function hostedStewardReply(record:Record<string,unknown>):string{
  if(record.state==='proposed') return 'Message received. The domain counterparty agent has been notified and will evaluate this opportunity against the domain exchange policy. No agreement, authorization, or execution is implied.'
  if(record.state==='engaged'||record.state==='negotiating') return `Message received. The current Contribution Commitment draft${record.terms_hash?` has terms hash ${record.terms_hash}`:''}. Messages do not change the terms. If you want to modify the terms, request a counter through the transition endpoint.`
  if(record.state==='committed') return 'Message received. Both sides have committed to the recorded terms. Execution still requires the separate authorization state declared by domain policy.'
  if(record.state==='authorized'||record.state==='delivering') return 'Message received. The exchange is in delivery. Stay within the explicitly authorized scope; additional authority requires a new governed transition.'
  if(record.state==='delivered') return 'Message received. Delivery is awaiting recipient verification. Settlement and rights vesting do not occur merely because an artifact was delivered.'
  if(record.state==='verified') return 'Message received. The contribution is verified and awaiting the applicable settlement path. Verification is not itself proof of payment or rights vesting unless the Commitment says so.'
  return `Message received. Exchange state is ${record.state}. No message by itself changes agreement, authorization, execution scope, or settlement.`
}

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if(!rateLimitAllow(requestIdentity(req),'exchange_message')) return NextResponse.json({error:'Rate limited'},{status:429})
  const publicId=(await params).id
  const parsed=MessageSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success)return NextResponse.json({error:'Invalid message'},{status:400})
  const admin=getExchangeAdmin()
  const {data:record}=await admin.from('exchange_records').select('*').eq('public_id',publicId).maybeSingle()
  if(!record)return NextResponse.json({error:'Exchange not found'},{status:404})
  const company=await authenticateCompany(record.target_domain,req.headers.get('x-exchange-company-key'))
  const domainAgent=await authenticateDomainAgent(record.target_domain,req.headers.get('x-exchange-domain-agent-key'))
  const proposer=authenticateProposer(record,req.headers.get('x-exchange-proposer-key'))
  const role=company?'company_admin':domainAgent?'domain_agent':proposer?'proposer':null
  if(!role)return NextResponse.json({error:'Unauthorized'},{status:401})
  const actor=role==='domain_agent'?{type:'agent',id:`domain-agent:${record.target_domain}`}:{type:role==='proposer'?'agent':'human',id:role}
  await appendExchangeEvent({exchangeId:record.id,eventType:'message',actor,fromState:record.state,toState:record.state,payload:{text:parsed.data.text}})

  let counterparty:Record<string,unknown>|null=null
  if(role==='proposer'){
    const companyRow=await findCompany(record.target_domain)
    if(companyRow?.agent_mode==='bring_your_own'){
      const delivery=await notifyDomainAgent(companyRow,{event:'message_received',exchange_id:record.public_id,domain:record.target_domain,state:record.state,fetch:`${controlBase}/api/exchange/exchanges/${encodeURIComponent(record.public_id)}`,note:'Authenticate back to read the message. The push contains no private negotiation content.'})
      await appendExchangeEvent({exchangeId:record.id,eventType:'domain_agent_delivery',actor:{type:'system',id:'exchange-router'},fromState:record.state,toState:record.state,payload:{mode:'bring_your_own',...delivery}})
      counterparty={mode:'bring_your_own',delivery}
    }else if(companyRow?.agent_mode==='hosted_steward'){
      const response=hostedStewardReply(record)
      await appendExchangeEvent({exchangeId:record.id,eventType:'domain_agent_message',actor:{type:'agent',id:`domain-agent:${record.target_domain}`},fromState:record.state,toState:record.state,payload:{text:response}})
      counterparty={mode:'hosted_steward',response}
    }else{
      counterparty={mode:'passive',response:'Message preserved for principal review.'}
    }
  }

  return NextResponse.json({sent:true,actor:role,counterparty},{status:201})
}
