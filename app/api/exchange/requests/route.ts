import { NextRequest, NextResponse } from 'next/server'
import { RequestSchema } from '@/exchange-gateway/src/schema'
import { appendExchangeEvent, findCompany, getExchangeAdmin, hashSecret, logEncounter, newPublicId, newSecret, requestIdentity, safeEqual } from '@/lib/exchange/server'
import { dispatchToDomainAgent } from '@/lib/exchange/steward'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'
import { captureServer } from '@/lib/infra/posthog/server'

export async function POST(req:NextRequest){
  const ip=requestIdentity(req)
  if(!rateLimitAllow(ip,'exchange_request')) {
    await logEncounter({targetDomain:'',endpoint:'/api/exchange/requests',req,result:'rate_limited'})
    return NextResponse.json({error:'Rate limited'},{status:429})
  }
  const parsed=RequestSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success) {
    await logEncounter({targetDomain:'',endpoint:'/api/exchange/requests',req,result:'validation_error'})
    return NextResponse.json({error:'Invalid request',details:parsed.error.flatten()},{status:400})
  }
  const p=parsed.data
  if(p.honeypot) return NextResponse.json({error:'Rejected'},{status:400})
  const company=await findCompany(p.targetDomain)
  if(!company||company.verification_status!=='verified'||!company.accepts_requests) {
    await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/requests',req,result:'not_found'})
    return NextResponse.json({error:'Target domain is not accepting contribution requests'},{status:409})
  }

  const admin=getExchangeAdmin()
  let agentId:string|null=null
  if(p.agentId){
    const agentKey=req.headers.get('x-exchange-agent-key')
    const {data:agent}=await admin.from('exchange_agents').select('id,agent_key_hash').eq('id',p.agentId).maybeSingle()
    if(!agent||!agentKey||!safeEqual(hashSecret(agentKey),agent.agent_key_hash)) {
      await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/requests',req,result:'auth_error'})
      return NextResponse.json({error:'Invalid registered-agent credential'},{status:401})
    }
    agentId=agent.id
  }

  const proposerKey=newSecret('request')
  const publicId=newPublicId()
  const initiator={type:'agent',id:p.agentDid||agentId||`guest:${publicId}`,displayName:p.agentName,email:p.contactEmail,did:p.agentDid}
  const proposalDetail={category:p.category,confidence:p.confidence??null,impact:p.impact?{expected_change:p.impact.expectedChange,assumptions:p.impact.assumptions}:null,required_authorization:p.requiredAuthorization,verification:p.verification??null,effort:p.effort??null}
  const {data,error}=await admin.from('exchange_records').insert({
    public_id:publicId,kind:'contribution_request',state:'proposed',target_domain:p.targetDomain,company_id:company.id,
    initiator_agent_id:agentId,initiator_identity:initiator,title:p.title,requested_contribution:p.requestedContribution,
    offering:p.offering||null,evidence:p.evidenceUris,proposed_consideration:p.consideration,proposal_detail:proposalDetail,
    proposer_key_hash:hashSecret(proposerKey),referral_code:p.referralCode||null,
  }).select('id,public_id,state,target_domain,title,created_at').single()
  if(error) {
    await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/requests',req,result:'server_error'})
    return NextResponse.json({error:'Request creation failed'},{status:500})
  }

  await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/requests',req,result:'ok',agentIdentity:initiator,metadata:{category:p.category,public_id:publicId}})
  await captureServer('exchange-system','exchange_request_created',{target_domain:p.targetDomain,category:p.category})

  await appendExchangeEvent({exchangeId:data.id,eventType:'request_created',actor:initiator,fromState:null,toState:'proposed',payload:{title:p.title,category:p.category,proposal_detail:proposalDetail}})
  const counterparty=await dispatchToDomainAgent({
    company,
    exchange:data,
    triage:{category:p.category,consideration:p.consideration,requiredAuthorization:p.requiredAuthorization},
    eventType:'request_received',
  })
  const finalState=counterparty.decision?.disposition==='engage'?'negotiating':'proposed'
  return NextResponse.json({
    exchange:{...data,state:finalState},
    counterparty,
    proposer_key:proposerKey,
    warning:'Save this request key. It authenticates the requesting agent to this exchange. A request or engagement never grants execution authority.',
  },{status:201})
}
