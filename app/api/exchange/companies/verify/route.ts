import { resolveTxt } from 'node:dns/promises'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateCompany, findCompany, getExchangeAdmin, normalizeDomain, requestIdentity } from '@/lib/exchange/server'
import { rateLimitAllow } from '@/lib/exchange/rate-limit'
export const runtime='nodejs'
export async function POST(req:NextRequest){
  if(!rateLimitAllow(requestIdentity(req),'exchange_company_verify')) return NextResponse.json({error:'Rate limited'},{status:429})
  const body=await req.json().catch(()=>({})); const domain=normalizeDomain(String(body.domain||'')); const key=req.headers.get('x-exchange-company-key')
  if(!domain||!(await authenticateCompany(domain,key))) return NextResponse.json({error:'Unauthorized'},{status:401})
  const company=await findCompany(domain); if(!company) return NextResponse.json({error:'Company not found'},{status:404})
  let rows:string[][]; try{rows=await resolveTxt(`_contribution-exchange.${domain}`)}catch{return NextResponse.json({error:'Verification TXT record not found',expected:`cx-verification=${company.verification_token}`},{status:409})}
  const values=rows.map(r=>r.join('')); const expected=`cx-verification=${company.verification_token}`; if(!values.includes(expected)) return NextResponse.json({error:'Verification token mismatch',expected},{status:409})
  const admin=getExchangeAdmin(); const {error}=await admin.from('exchange_companies').update({verification_status:'verified',verified_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',company.id); if(error) return NextResponse.json({error:'Verification update failed'},{status:500})
  return NextResponse.json({verified:true,domain})
}
