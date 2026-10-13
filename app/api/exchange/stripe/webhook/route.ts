import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/infra/stripe/server'
import { appendExchangeEvent, getExchangeAdmin } from '@/lib/exchange/server'

export async function POST(req:NextRequest){
  const secret=process.env.EXCHANGE_STRIPE_WEBHOOK_SECRET
  if(!secret) return NextResponse.json({error:'Exchange webhook not configured'},{status:500})
  const sig=req.headers.get('stripe-signature')
  if(!sig) return NextResponse.json({error:'Missing signature'},{status:400})
  const stripe=getStripe()
  if(!stripe) return NextResponse.json({error:'Stripe not configured'},{status:500})
  let event:Stripe.Event
  try{event=stripe.webhooks.constructEvent(await req.text(),sig,secret)}catch{return NextResponse.json({error:'Invalid signature'},{status:400})}
  if(event.type!=='checkout.session.completed') return NextResponse.json({received:true})
  const session=event.data.object as Stripe.Checkout.Session
  // checkout.session.completed can fire for async payment methods before funds are captured.
  if(session.payment_status!=='paid') return NextResponse.json({received:true,settled:false})
  const publicId=session.metadata?.exchange_public_id
  if(!publicId) return NextResponse.json({received:true})
  try{
    const admin=getExchangeAdmin()
    const {data:record,error:recordError}=await admin.from('exchange_records').select('id,state').eq('public_id',publicId).maybeSingle()
    if(recordError) throw recordError
    if(!record) return NextResponse.json({received:true})
    const now=new Date().toISOString()
    // Only flip a settlement that is awaiting payment for THIS checkout session.
    const {data:updated,error:settlementError}=await admin.from('exchange_settlements')
      .update({status:'settled',payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,settled_at:now,updated_at:now})
      .eq('exchange_id',record.id).eq('checkout_session_id',session.id).eq('status','awaiting_payment').select('exchange_id')
    if(settlementError) throw settlementError
    if(!updated||updated.length===0){
      // Retry after a partial failure: settlement already flipped for this session, record may not have been.
      const {data:already,error:alreadyError}=await admin.from('exchange_settlements').select('exchange_id').eq('exchange_id',record.id).eq('checkout_session_id',session.id).eq('status','settled')
      if(alreadyError) throw alreadyError
      if(!already||already.length===0) return NextResponse.json({received:true,settled:false})
    }
    if(record.state==='verified'){
      const {data:moved,error:recordUpdateError}=await admin.from('exchange_records').update({state:'settled',updated_at:now}).eq('id',record.id).eq('state','verified').select('id')
      if(recordUpdateError) throw recordUpdateError
      if(moved&&moved.length>0) await appendExchangeEvent({exchangeId:record.id,eventType:'stripe_settlement_completed',actor:{type:'system',id:'stripe'},fromState:'verified',toState:'settled',payload:{checkout_session_id:session.id}})
    }
    return NextResponse.json({received:true})
  }catch(error){
    console.error('exchange stripe webhook failed',error instanceof Error?error.message:error)
    return NextResponse.json({error:'Webhook processing failed'},{status:500})
  }
}
