import { NextRequest, NextResponse } from 'next/server'
import { TransitionSchema } from '@/exchange-gateway/src/schema'
import { canTransition, transitionRoleAllowed } from '@/exchange-gateway/src/state-machine'
import { finalizeCommitment } from '@/exchange-gateway/src/commitment'
import { commitmentAuthorizationWithinCeiling } from '@/exchange-gateway/src/policy'
import type { ExchangeState } from '@/exchange-gateway/src/types'
import { companyPolicy } from '@/lib/exchange/steward'
import { appendExchangeEvent, authenticateCompany, authenticateDomainAgent, authenticateProposer, findCompany, getExchangeAdmin } from '@/lib/exchange/server'

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const publicId=(await params).id
  const parsed=TransitionSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success) return NextResponse.json({error:'Invalid transition',details:parsed.error.flatten()},{status:400})
  const admin=getExchangeAdmin()
  const {data:record}=await admin.from('exchange_records').select('*').eq('public_id',publicId).maybeSingle()
  if(!record) return NextResponse.json({error:'Exchange not found'},{status:404})
  const companyAdmin=await authenticateCompany(record.target_domain,req.headers.get('x-exchange-company-key'))
  const domainAgent=await authenticateDomainAgent(record.target_domain,req.headers.get('x-exchange-domain-agent-key'))
  const proposer=authenticateProposer(record,req.headers.get('x-exchange-proposer-key'))
  const role=companyAdmin||domainAgent?'company':proposer?'proposer':null
  if(!role) return NextResponse.json({error:'Unauthorized'},{status:401})
  const actor=domainAgent&&!companyAdmin?{type:'agent',id:`domain-agent:${record.target_domain}`}:{type:role==='company'?'human':'agent',id:role}
  const from=record.state as ExchangeState
  const requested=parsed.data.toState as ExchangeState
  const company=domainAgent?await findCompany(record.target_domain):null
  const policy=company?companyPolicy(company):null

  if(domainAgent&&!companyAdmin){
    if(requested==='verified'||requested==='closed') return NextResponse.json({error:'This action is reserved for the company principal in v0.2'},{status:403})
    if(requested==='committed'&&policy?.human_required_for_commitment) return NextResponse.json({error:'Company policy requires principal approval for commitment'},{status:403})
    if(requested==='authorized'){
      if(!policy||policy.human_required_for_execution) return NextResponse.json({error:'Company policy requires principal approval for execution authorization'},{status:403})
      if(!record.commitment||!commitmentAuthorizationWithinCeiling(record.commitment,policy.authority_ceiling)) return NextResponse.json({error:'Committed authorization exceeds the domain agent authority ceiling'},{status:403})
    }
  }

  if(requested==='committed'){
    if(!['engaged','negotiating'].includes(from)) return NextResponse.json({error:`Cannot accept commitment from ${from}`},{status:409})
    if(!parsed.data.commitment) return NextResponse.json({error:'Commitment object required'},{status:400})
    const commitment=finalizeCommitment(parsed.data.commitment)
    const hash=commitment.provenance.terms_hash!
    const existing=record.terms_hash===hash ? (record.commitment_acceptances||{}) : {}
    const acceptanceRole=role==='company'?'company':'proposer'
    const acceptances={...existing,[acceptanceRole]:{terms_hash:hash,accepted_at:new Date().toISOString(),accepted_by:domainAgent&&!companyAdmin?'domain_agent':acceptanceRole}}
    const both=!!acceptances.company&&!!acceptances.proposer
    const nextState:ExchangeState=both?'committed':'negotiating'
    const {error}=await admin.from('exchange_records').update({commitment,terms_hash:hash,commitment_acceptances:acceptances,state:nextState,updated_at:new Date().toISOString()}).eq('id',record.id)
    if(error) return NextResponse.json({error:'Commitment update failed'},{status:500})
    await appendExchangeEvent({exchangeId:record.id,eventType:'commitment_accepted',actor,fromState:from,toState:nextState,payload:{terms_hash:hash,awaiting_counterparty:!both}})
    return NextResponse.json({state:nextState,terms_hash:hash,acceptances,awaiting_counterparty:!both})
  }

  if(!canTransition(from,requested)) return NextResponse.json({error:`Transition ${from} → ${requested} is not allowed`},{status:409})
  if(!transitionRoleAllowed(role,requested)) return NextResponse.json({error:`${role} cannot transition to ${requested}`},{status:403})
  const {error}=await admin.from('exchange_records').update({state:requested,updated_at:new Date().toISOString()}).eq('id',record.id)
  if(error) return NextResponse.json({error:'Transition failed'},{status:500})
  await appendExchangeEvent({exchangeId:record.id,eventType:'state_transition',actor,fromState:from,toState:requested,payload:{note:parsed.data.note}})
  return NextResponse.json({public_id:publicId,from,to:requested,actor:domainAgent&&!companyAdmin?'domain_agent':role})
}
