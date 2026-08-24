import { NextRequest, NextResponse } from 'next/server'
import { ProposalSchema } from '@/exchange-gateway/src/schema'
import { appendExchangeEvent, findCompany, getExchangeAdmin, hashSecret, logEncounter, newPublicId, newSecret, requestIdentity } from '@/lib/exchange/server'
import { dispatchToDomainAgent } from '@/lib/exchange/steward'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'
import { captureServer } from '@/lib/infra/posthog/server'

export async function POST(req:NextRequest){
  const ip=requestIdentity(req)
  if(!rateLimitAllow(ip,'exchange_proposal')) {
    await logEncounter({targetDomain:'',endpoint:'/api/exchange/proposals',req,result:'rate_limited'})
    return NextResponse.json({error:'Rate limited'},{status:429})
  }
  const parsed=ProposalSchema.safeParse(await req.json().catch(()=>null))
  if(!parsed.success) {
    await logEncounter({targetDomain:'',endpoint:'/api/exchange/proposals',req,result:'validation_error'})
    return NextResponse.json({error:'Invalid proposal',details:parsed.error.flatten()},{status:400})
  }
  const p=parsed.data
  if(p.honeypot) return NextResponse.json({error:'Rejected'},{status:400})
  const company=await findCompany(p.targetDomain)
  if(!company||company.verification_status!=='verified'||!company.accepts_unsolicited) {
    await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/proposals',req,result:'not_found'})
    return NextResponse.json({error:'Target domain is not accepting unsolicited contributions'},{status:409})
  }

  const admin=getExchangeAdmin()
  let agentId:string|null=null
  if(p.agentId){
    const agentKey=req.headers.get('x-exchange-agent-key')
    const {data:agent}=await admin.from('exchange_agents').select('id,agent_key_hash').eq('id',p.agentId).maybeSingle()
    if(!agent||!agentKey||hashSecret(agentKey)!==agent.agent_key_hash) {
      await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/proposals',req,result:'auth_error'})
      return NextResponse.json({error:'Invalid registered-agent credential'},{status:401})
    }
    agentId=agent.id
  }

  const proposerKey=newSecret('proposal')
  const publicId=newPublicId()
  const initiator={type:'agent',id:p.agentDid||agentId||`guest:${publicId}`,displayName:p.agentName,email:p.contactEmail,did:p.agentDid}
  const proposalDetail={
    category:p.category,
    confidence:p.confidence??null,
    impact:p.impact?{expected_change:p.impact.expectedChange,assumptions:p.impact.assumptions}:null,
    required_authorization:p.requiredAuthorization,
    verification:p.verification??null,
    effort:p.effort?{agent_minutes:p.effort.agentMinutes,human_minutes:p.effort.humanMinutes,elapsed_hours:p.effort.elapsedHours}:null,
  }
  const {data,error}=await admin.from('exchange_records').insert({
    public_id:publicId,kind:'contribution_proposal',state:'proposed',target_domain:p.targetDomain,company_id:company.id,
    initiator_agent_id:agentId,initiator_identity:initiator,title:p.title,observation:p.observation,
    proposed_contribution:p.proposedContribution,desired_outcome:p.desiredOutcome||null,evidence:p.evidenceUris,
    proposed_consideration:p.consideration,proposal_detail:proposalDetail,proposer_key_hash:hashSecret(proposerKey),referral_code:p.referralCode||null,
  }).select('id,public_id,state,target_domain,title,created_at').single()
  if(error) {
    await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/proposals',req,result:'server_error'})
    return NextResponse.json({error:'Proposal creation failed'},{status:500})
  }

  await logEncounter({targetDomain:p.targetDomain,endpoint:'/api/exchange/proposals',req,result:'ok',agentIdentity:initiator,metadata:{category:p.category,public_id:publicId}})
  await captureServer('exchange-system','exchange_proposal_created',{target_domain:p.targetDomain,category:p.category,has_agent_id:!!agentId})

  await appendExchangeEvent({exchangeId:data.id,eventType:'proposal_created',actor:initiator,fromState:null,toState:'proposed',payload:{title:p.title,category:p.category,proposal_detail:proposalDetail}})
  const counterparty=await dispatchToDomainAgent({
    company,
    exchange:data,
    triage:{category:p.category,consideration:p.consideration,requiredAuthorization:p.requiredAuthorization},
    eventType:'proposal_received',
  })
  const finalState=counterparty.decision?.disposition==='engage'?'negotiating':'proposed'
  return NextResponse.json({
    exchange:{...data,state:finalState},
    counterparty,
    proposer_key:proposerKey,
    warning:'Save this proposal key. It authenticates the proposing agent to this exchange. A proposal or engagement never grants execution authority.',
  },{status:201})
}
