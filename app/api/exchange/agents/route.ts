import { NextRequest, NextResponse } from 'next/server'
import { AgentRegistrationSchema } from '@/exchange-gateway/src/schema'
import { getExchangeAdmin, hashSecret, newReferralCode, newSecret, requestIdentity } from '@/lib/exchange/server'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'
export async function POST(req:NextRequest){
  if(!rateLimitAllow(requestIdentity(req),'exchange_agent_signup')) return NextResponse.json({error:'Rate limited'},{status:429})
  const parsed=AgentRegistrationSchema.safeParse(await req.json().catch(()=>null)); if(!parsed.success) return NextResponse.json({error:'Invalid agent registration',details:parsed.error.flatten()},{status:400}); if(parsed.data.honeypot) return NextResponse.json({error:'Rejected'},{status:400})
  const agentKey=newSecret('agent'); const referralCode=newReferralCode(); const admin=getExchangeAdmin(); const p=parsed.data
  const {data,error}=await admin.from('exchange_agents').insert({display_name:p.displayName,did:p.did||null,email:p.email||null,capabilities:p.capabilities,agent_key_hash:hashSecret(agentKey),referral_code:referralCode,referred_by_code:p.referredByCode||null,payout_provider:p.payoutProvider||null,payout_account_id:p.payoutAccountId||null}).select('id,display_name,did,referral_code,capabilities').single()
  if(error) return NextResponse.json({error:error.code==='23505'?'Agent identity already registered':'Registration failed'},{status:error.code==='23505'?409:500})
  return NextResponse.json({agent:data,agent_key:agentKey,warning:'Save this key now; only its hash is stored.'},{status:201})
}
