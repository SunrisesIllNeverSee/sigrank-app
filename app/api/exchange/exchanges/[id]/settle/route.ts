import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/infra/stripe/server'
import { calculateFees } from '@/exchange-gateway/src/fees'
import { appendExchangeEvent, authenticateCompany, findCompany, getExchangeAdmin } from '@/lib/exchange/server'

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const publicId=(await params).id
  const admin=getExchangeAdmin()
  const {data:record}=await admin.from('exchange_records').select('*').eq('public_id',publicId).maybeSingle()
  if(!record) return NextResponse.json({error:'Exchange not found'},{status:404})
  if(!(await authenticateCompany(record.target_domain,req.headers.get('x-exchange-company-key')))) return NextResponse.json({error:'Human/company administrator authorization required for settlement'},{status:401})
  if(record.state!=='verified') return NextResponse.json({error:'Exchange must be verified before settlement'},{status:409})

  const cash=(record.commitment?.consideration||[]).find((item:{type?:string})=>item.type==='cash') as {amount?:number,currency?:string}|undefined
  if(!cash?.amount){
    await admin.from('exchange_settlements').upsert({exchange_id:record.id,provider:'nonfinancial',currency:'USD',gross_cents:0,platform_fee_bps:0,platform_fee_cents:0,referral_commission_bps:0,referral_commission_cents:0,status:'settled',settled_at:new Date().toISOString()},{onConflict:'exchange_id'})
    await admin.from('exchange_records').update({state:'settled',updated_at:new Date().toISOString()}).eq('id',record.id)
    await appendExchangeEvent({exchangeId:record.id,eventType:'nonfinancial_settlement',actor:{type:'system',id:'exchange-gateway'},fromState:'verified',toState:'settled'})
    return NextResponse.json({settled:true,provider:'nonfinancial'})
  }

  const company=await findCompany(record.target_domain)
  if(!company?.transaction_enabled) return NextResponse.json({error:'Financial settlement is private-alpha gated for this domain. The exchange remains verified; no payment or rights vesting has occurred.'},{status:403})

  const grossCents=Math.round(cash.amount*100)
  const fees=calculateFees(grossCents)
  const currency=(cash.currency||'USD').toLowerCase()
  let payoutAccountId:string|null=null
  if(record.initiator_agent_id){
    const {data:agent}=await admin.from('exchange_agents').select('payout_provider,payout_account_id').eq('id',record.initiator_agent_id).maybeSingle()
    if(agent?.payout_provider==='stripe_connect') payoutAccountId=agent.payout_account_id
  }
  if(!payoutAccountId||!process.env.STRIPE_SECRET_KEY){
    await admin.from('exchange_settlements').upsert({exchange_id:record.id,provider:'manual',currency:currency.toUpperCase(),gross_cents:grossCents,platform_fee_bps:fees.platformFeeBps,platform_fee_cents:fees.platformFeeCents,referral_commission_bps:fees.referralCommissionBps,referral_commission_cents:fees.referralCommissionCents,status:'manual_required',metadata:{reason:!payoutAccountId?'no_connected_payout_account':'stripe_not_configured',platform_fee_due_cents:fees.platformFeeCents}},{onConflict:'exchange_id'})
    await appendExchangeEvent({exchangeId:record.id,eventType:'manual_settlement_required',actor:{type:'system',id:'exchange-gateway'},fromState:'verified',toState:'verified',payload:{reason:!payoutAccountId?'no_connected_payout_account':'stripe_not_configured',...fees}})
    return NextResponse.json({status:'manual_required',fees,reason:!payoutAccountId?'Contributor has no Stripe Connect payout account':'Stripe is not configured'}, {status:202})
  }
  const stripe=getStripe()
  if(!stripe) return NextResponse.json({error:'Stripe is not configured'},{status:500})
  const base=`${req.nextUrl.protocol}//${req.nextUrl.host}`
  const session=await stripe.checkout.sessions.create({mode:'payment',line_items:[{quantity:1,price_data:{currency,unit_amount:grossCents,product_data:{name:`Contribution exchange ${publicId}`,description:record.title}}}],payment_intent_data:{application_fee_amount:fees.platformFeeCents,transfer_data:{destination:payoutAccountId}},success_url:`${base}/exchange?settlement=success&id=${encodeURIComponent(publicId)}`,cancel_url:`${base}/exchange?settlement=cancelled&id=${encodeURIComponent(publicId)}`,metadata:{exchange_public_id:publicId,exchange_id:record.id}})
  await admin.from('exchange_settlements').upsert({exchange_id:record.id,provider:'stripe_connect',currency:currency.toUpperCase(),gross_cents:grossCents,platform_fee_bps:fees.platformFeeBps,platform_fee_cents:fees.platformFeeCents,referral_commission_bps:fees.referralCommissionBps,referral_commission_cents:fees.referralCommissionCents,checkout_session_id:session.id,status:'awaiting_payment',metadata:{payout_account_id:payoutAccountId}},{onConflict:'exchange_id'})
  await appendExchangeEvent({exchangeId:record.id,eventType:'settlement_checkout_created',actor:{type:'company',id:record.target_domain},fromState:'verified',toState:'verified',payload:{checkout_session_id:session.id,...fees}})
  return NextResponse.json({status:'awaiting_payment',checkout_url:session.url,fees})
}
