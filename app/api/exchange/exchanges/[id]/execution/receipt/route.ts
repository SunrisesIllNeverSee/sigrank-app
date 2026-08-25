import { NextRequest, NextResponse } from 'next/server'
import { SubmitReceiptSchema } from '@/exchange-gateway/src/schema'
import { getVerifier, VerificationError } from '@/exchange-gateway/src/providers/callback-verifier'
import { validateTransition, receiptStatusToState } from '@/exchange-gateway/src/execution-state'
import { appendExchangeEvent, authenticateCompany, authenticateProposer, getExchangeAdmin, logEncounter } from '@/lib/exchange/server'
import { createHash } from 'node:crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const publicId = (await params).id
  const admin = getExchangeAdmin()

  const { data: record } = await admin.from('exchange_records').select('*').eq('public_id', publicId).maybeSingle()
  if (!record) return NextResponse.json({ error: 'Exchange not found' }, { status: 404 })

  await logEncounter({
    targetDomain: record.target_domain,
    endpoint: `/api/exchange/exchanges/${publicId}/execution/receipt`,
    method: 'POST',
    req,
    result: 'ok',
  })

  if (record.state !== 'delivering' && record.state !== 'delivered' && record.state !== 'verified') {
    return NextResponse.json({ error: 'Exchange must be in delivering, delivered, or verified state to accept execution receipts' }, { status: 409 })
  }

  // ─── Authentication ───
  // For external provider callbacks: verify the cryptographic signature.
  // For internal/self-executed receipts: authenticate via company key or proposer key.
  const companyKey = req.headers.get('x-exchange-company-key')
  const proposerKey = req.headers.get('x-exchange-proposer-key')
  const isCompany = await authenticateCompany(record.target_domain, companyKey)
  const isProposer = authenticateProposer(record, proposerKey)
  const providerSignature = req.headers.get('x-provider-signature')

  // Read the raw body ONCE — needed for signature verification
  let rawBody: Uint8Array
  try {
    rawBody = new Uint8Array(await req.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  let body: unknown
  try {
    body = JSON.parse(new TextDecoder().decode(rawBody))
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SubmitReceiptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const receipt = parsed.data.receipt

  // ─── Load the persisted execution ───
  const { data: execution } = await admin.from('exchange_executions')
    .select('*')
    .eq('execution_id', receipt.execution_reference.execution_id)
    .eq('exchange_id', record.id)
    .maybeSingle()

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found for this exchange' }, { status: 404 })
  }

  // ─── Provider binding check ───
  if (
    receipt.provider !== execution.provider ||
    receipt.execution_reference.provider !== execution.provider ||
    receipt.provider_reference !== execution.provider_reference ||
    receipt.execution_reference.provider_reference !== execution.provider_reference
  ) {
    return NextResponse.json({ error: 'Receipt provider reference does not match the persisted execution' }, { status: 409 })
  }

  // ─── Authentication path ───
  let authenticatedProviderId: string | null = null
  let verifiedEventId: string | null = null
  let verifiedTimestamp: string | null = null
  let verifiedNonce: string | null = null
  let payloadHash: string

  if (execution.provider !== 'internal') {
    // External provider — must be cryptographically authenticated
    if (providerSignature) {
      const verifier = getVerifier(execution.provider)
      if (!verifier) {
        return NextResponse.json({ error: `No callback verifier registered for provider '${execution.provider}'` }, { status: 403 })
      }

      try {
        const verified = await verifier.verify({
          rawBody,
          headers: req.headers,
          receivedAt: new Date(),
        })
        // Authenticated provider ID must equal the persisted execution provider
        if (verified.providerId !== execution.provider) {
          return NextResponse.json({ error: 'Authenticated provider does not match the persisted execution provider' }, { status: 403 })
        }
        authenticatedProviderId = verified.providerId
        verifiedEventId = verified.providerEventId
        verifiedTimestamp = verified.timestamp.toISOString()
        verifiedNonce = verified.nonce ?? null
        payloadHash = verified.payloadHash
      } catch (err) {
        const code = err instanceof VerificationError ? err.code : 'verification_failed'
        // Log safe identifier, no secrets
        await appendExchangeEvent({
          exchangeId: record.id,
          eventType: 'execution_callback_rejected',
          actor: { type: 'system', id: 'callback-verifier' },
          fromState: record.state as any,
          toState: record.state as any,
          payload: {
            execution_id: receipt.execution_reference.execution_id,
            provider: execution.provider,
            rejection_code: code,
            authoritative_exchange_state_advanced: false,
          },
        })
        return NextResponse.json({ error: `Provider callback verification failed: ${code}` }, { status: 401 })
      }
    } else {
      // No signature — only company principal can ingest external receipts
      if (!isCompany) {
        return NextResponse.json({ error: 'External execution receipts require provider callback authentication or company-principal ingestion' }, { status: 403 })
      }
      // Company principal ingestion — use body-provided event ID or derive
      verifiedEventId = parsed.data.provider_event_id ?? `manual_${Date.now()}_${receipt.execution_reference.execution_id}`
      verifiedTimestamp = parsed.data.provider_event_timestamp ?? new Date().toISOString()
      verifiedNonce = parsed.data.nonce ?? null
      payloadHash = createHash('sha256').update(rawBody).digest('hex')
    }
  } else {
    // Internal provider — authenticated internal path
    if (!isCompany && !isProposer) {
      return NextResponse.json({ error: 'Company administrator or proposer authorization required to submit internal execution receipt' }, { status: 401 })
    }
    verifiedEventId = parsed.data.provider_event_id ?? `internal_${Date.now()}_${receipt.execution_reference.execution_id}`
    verifiedTimestamp = parsed.data.provider_event_timestamp ?? new Date().toISOString()
    verifiedNonce = parsed.data.nonce ?? null
    payloadHash = createHash('sha256').update(rawBody).digest('hex')
  }

  // ─── Idempotency check ───
  // Check if a receipt already exists for this (provider, provider_event_id)
  const { data: existingReceipt } = await admin.from('exchange_execution_receipts')
    .select('id, payload_hash')
    .eq('provider', execution.provider)
    .eq('provider_event_id', verifiedEventId)
    .maybeSingle()

  if (existingReceipt) {
    if (existingReceipt.payload_hash === payloadHash) {
      // Idempotent duplicate — return success, no new receipt
      return NextResponse.json({
        accepted: true,
        idempotent: true,
        execution_id: receipt.execution_reference.execution_id,
        execution_status: receipt.status,
        exchange_state: record.state,
        authoritative_exchange_state_advanced: false,
        existing_receipt_id: existingReceipt.id,
      })
    } else {
      // Same event ID, different payload — conflict
      await appendExchangeEvent({
        exchangeId: record.id,
        eventType: 'execution_receipt_conflict',
        actor: { type: 'system', id: 'idempotency-guard' },
        fromState: record.state as any,
        toState: record.state as any,
        payload: {
          execution_id: receipt.execution_reference.execution_id,
          provider: execution.provider,
          provider_event_id: verifiedEventId,
          conflict: 'payload_hash_mismatch',
          authoritative_exchange_state_advanced: false,
        },
      })
      return NextResponse.json({
        error: 'Provider event ID conflict: same event ID with different payload',
        provider_event_id: verifiedEventId,
      }, { status: 409 })
    }
  }

  // ─── State transition validation ───
  const newState = receiptStatusToState(receipt.status)
  const currentState = execution.state as any
  const transition = validateTransition(currentState, newState)

  if (!transition.allowed) {
    // Store the rejected observation for audit but don't change state
    await appendExchangeEvent({
      exchangeId: record.id,
      eventType: 'execution_receipt_rejected_stale',
      actor: { type: isCompany ? 'company' : 'system', id: isCompany ? record.target_domain : 'callback-verifier' },
      fromState: record.state as any,
      toState: record.state as any,
      payload: {
        execution_id: receipt.execution_reference.execution_id,
        provider: receipt.provider,
        execution_status: receipt.status,
        attempted_state: newState,
        current_execution_state: currentState,
        rejection_reason: transition.reason,
        authoritative_exchange_state_advanced: false,
      },
    })
    return NextResponse.json({
      accepted: false,
      rejected: true,
      reason: transition.reason,
      execution_id: receipt.execution_reference.execution_id,
      current_execution_state: currentState,
      attempted_state: newState,
    }, { status: 409 })
  }

  // ─── Insert receipt (atomic) ───
  const { error: receiptError } = await admin.from('exchange_execution_receipts').insert({
    execution_id: receipt.execution_reference.execution_id,
    exchange_id: record.id,
    provider: receipt.provider,
    provider_reference: receipt.provider_reference,
    status: receipt.status,
    executor: receipt.executor,
    artifact: receipt.artifact ?? null,
    verification: receipt.verification ?? null,
    settlement: receipt.settlement ?? null,
    timestamps: receipt.timestamps,
    provider_metadata: receipt.provider_metadata ?? null,
    raw: receipt,
    provider_event_id: verifiedEventId,
    provider_event_timestamp: verifiedTimestamp,
    nonce: verifiedNonce,
    payload_hash: payloadHash,
    verified_provider_id: authenticatedProviderId,
  })
  if (receiptError) {
    // Check if it's a unique constraint violation (concurrent duplicate)
    if (receiptError.code === '23505') {
      // Concurrent duplicate — return idempotent success
      return NextResponse.json({
        accepted: true,
        idempotent: true,
        execution_id: receipt.execution_reference.execution_id,
        execution_status: receipt.status,
        exchange_state: record.state,
        authoritative_exchange_state_advanced: false,
      })
    }
    return NextResponse.json({ error: 'Execution receipt persistence failed' }, { status: 500 })
  }

  // ─── Update execution state with optimistic concurrency ───
  if (!transition.is_duplicate) {
    const { error: executionError, count } = await admin.from('exchange_executions')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
        state_version: (execution.state_version ?? 0) + 1,
      })
      .eq('execution_id', receipt.execution_reference.execution_id)
      .eq('exchange_id', record.id)
      .eq('state_version', execution.state_version ?? 0)

    if (executionError) return NextResponse.json({ error: 'Execution state update failed' }, { status: 500 })
    if (count === 0) {
      // Optimistic concurrency conflict — another callback won
      // The receipt is stored as evidence; state may have already advanced
      await appendExchangeEvent({
        exchangeId: record.id,
        eventType: 'execution_receipt_concurrent_skip',
        actor: { type: 'system', id: 'optimistic-concurrency' },
        fromState: record.state as any,
        toState: record.state as any,
        payload: {
          execution_id: receipt.execution_reference.execution_id,
          provider: receipt.provider,
          execution_status: receipt.status,
          reason: 'state_version mismatch — another callback advanced state first',
          authoritative_exchange_state_advanced: false,
        },
      })
    }
  }

  // ─── Audit event (never advances exchange_records.state) ───
  await appendExchangeEvent({
    exchangeId: record.id,
    eventType: 'execution_receipt_submitted',
    actor: { type: isCompany ? 'company' : 'system', id: isCompany ? record.target_domain : (authenticatedProviderId ?? 'callback-verifier') },
    fromState: record.state as any,
    toState: record.state as any,
    payload: {
      execution_id: receipt.execution_reference.execution_id,
      provider: receipt.provider,
      execution_status: receipt.status,
      artifact_hash: receipt.artifact?.hash,
      verification_status: receipt.verification?.status,
      provider_event_id: verifiedEventId,
      authoritative_exchange_state_advanced: false,
    },
  })

  return NextResponse.json({
    accepted: true,
    idempotent: transition.is_duplicate,
    execution_id: receipt.execution_reference.execution_id,
    execution_status: receipt.status,
    execution_state: newState,
    exchange_state: record.state,
    authoritative_exchange_state_advanced: false,
    next: receipt.status === 'delivered' || receipt.status === 'verified'
      ? 'Use the governed exchange transition endpoint to evaluate and advance Contribution Exchange state independently.'
      : undefined,
  })
}
