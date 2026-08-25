import { NextRequest, NextResponse } from 'next/server'
import { SubmitReceiptSchema } from '@/exchange-gateway/src/schema'
import { getVerifier, VerificationError } from '@/exchange-gateway/src/providers/callback-verifier'
import { bootstrapVerifiers } from '@/exchange-gateway/src/providers/verifier-bootstrap'
import { validateTransition, receiptStatusToState } from '@/exchange-gateway/src/execution-state'
import { appendExchangeEvent, authenticateCompany, authenticateProposer, getExchangeAdmin, logEncounter } from '@/lib/exchange/server'
import { createHash } from 'node:crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Ensure any env-configured verifiers are registered before we look them up.
  bootstrapVerifiers()

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

  // ─── Authentication principals ───
  // Internal/self-executed receipts authenticate via company key or proposer key.
  // External provider callbacks authenticate via cryptographic signature ONLY —
  // never via company admin key, proposer session, or any shared bearer token.
  const companyKey = req.headers.get('x-exchange-company-key')
  const proposerKey = req.headers.get('x-exchange-proposer-key')
  const isCompany = await authenticateCompany(record.target_domain, companyKey)
  const isProposer = authenticateProposer(record, proposerKey)
  const providerSignature = req.headers.get('x-provider-signature')

  // Read the raw body ONCE — needed for signature verification over the exact
  // bytes the provider sent (not reserialized JSON).
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

  // ─── Provider binding check (before authentication, before any insert) ───
  // The receipt's provider and provider_reference must match the persisted
  // execution. This is checked here at the application layer AND enforced at
  // the DB layer via the composite FK (migration 0040).
  if (
    receipt.provider !== execution.provider ||
    receipt.execution_reference.provider !== execution.provider ||
    receipt.provider_reference !== execution.provider_reference ||
    receipt.execution_reference.provider_reference !== execution.provider_reference
  ) {
    return NextResponse.json({ error: 'Receipt provider reference does not match the persisted execution' }, { status: 409 })
  }

  // ─── Map receipt status to normalized state (fail-closed on unknown) ───
  const newState = receiptStatusToState(receipt.status)
  if (newState === null) {
    return NextResponse.json({
      error: `Unknown receipt status: '${receipt.status}'. Valid statuses: delivered, verified, failed, cancelled, disputed.`,
    }, { status: 422 })
  }

  // ─── Authentication path ───
  // External providers MUST authenticate via cryptographic signature. There is
  // no company-admin bypass for external receipts — a company admin key is a
  // shared bearer token and the spec explicitly forbids that as an
  // authentication method for external provider callbacks. Internal receipts
  // continue through the authenticated internal application path.
  let authenticatedProviderId: string | null = null
  let verifiedEventId: string
  let verifiedTimestamp: string
  let verifiedNonce: string | null
  let payloadHash: string

  if (execution.provider !== 'internal') {
    // ─── External provider — cryptographic signature required ───
    if (!providerSignature) {
      return NextResponse.json({
        error: 'External execution receipts require a cryptographic provider signature (x-provider-signature header). Company admin keys and proposer sessions are not accepted for external provider callbacks.',
      }, { status: 401 })
    }

    const verifier = getVerifier(execution.provider)
    if (!verifier) {
      return NextResponse.json({
        error: `No callback verifier registered for provider '${execution.provider}'. Callbacks cannot be authenticated.`,
      }, { status: 403 })
    }

    try {
      const verified = await verifier.verify({
        rawBody,
        headers: req.headers,
        receivedAt: new Date(),
      })
      // Authenticated provider ID must equal the persisted execution provider
      if (verified.providerId !== execution.provider) {
        return NextResponse.json({
          error: 'Authenticated provider does not match the persisted execution provider',
        }, { status: 403 })
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
    // ─── Internal provider — authenticated internal path ───
    if (!isCompany && !isProposer) {
      return NextResponse.json({ error: 'Company administrator or proposer authorization required to submit internal execution receipt' }, { status: 401 })
    }
    // Internal receipts use a deterministic event ID derived from stable
    // signed fields (provider + execution_id + payload hash), NOT from
    // arrival time or a random value. This makes retries idempotent.
    payloadHash = createHash('sha256').update(rawBody).digest('hex')
    verifiedEventId = parsed.data.provider_event_id
      ?? `internal_${execution.provider}_${receipt.execution_reference.execution_id}_${payloadHash.slice(0, 16)}`
    verifiedTimestamp = parsed.data.provider_event_timestamp ?? new Date().toISOString()
    verifiedNonce = parsed.data.nonce ?? null
  }

  // ─── Idempotency check (read-then-insert; the unique index is the atomic
  // backstop for concurrent duplicates) ───
  const { data: existingReceipt } = await admin.from('exchange_execution_receipts')
    .select('id, payload_hash')
    .eq('provider', execution.provider)
    .eq('provider_event_id', verifiedEventId)
    .maybeSingle()

  if (existingReceipt) {
    if (existingReceipt.payload_hash === payloadHash) {
      // Idempotent duplicate — return success, no new receipt, no state change
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
      // Same event ID, different payload — conflict (audited, no mutation)
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

  // ─── Insert receipt (atomic — the unique index backs this up) ───
  // The read-then-insert above handles the common case. The unique index on
  // (provider, provider_event_id) is the atomic backstop: if two concurrent
  // callbacks race past the read, exactly one insert succeeds and the other
  // gets a 23505 unique-violation, which we coerce to idempotent success.
  // Similarly the unique index on (provider, nonce) enforces nonce replay
  // protection atomically — a reused nonce inside its validity window is
  // rejected with 23505.
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
    // 23505 = unique violation. Could be a concurrent duplicate event ID OR
    // a replayed nonce. Both are safe to treat as idempotent/conflict.
    if (receiptError.code === '23505') {
      // Determine which constraint fired so we can respond appropriately.
      // A nonce violation is a replay attempt; an event-id violation is a
      // concurrent duplicate. Both result in no mutation.
      const isNonceViolation = receiptError.message.includes('idx_execution_receipts_provider_nonce')
      if (isNonceViolation) {
        await appendExchangeEvent({
          exchangeId: record.id,
          eventType: 'execution_nonce_replay_rejected',
          actor: { type: 'system', id: 'nonce-guard' },
          fromState: record.state as any,
          toState: record.state as any,
          payload: {
            execution_id: receipt.execution_reference.execution_id,
            provider: execution.provider,
            nonce: verifiedNonce,
            authoritative_exchange_state_advanced: false,
          },
        })
        return NextResponse.json({
          accepted: false,
          rejected: true,
          reason: 'nonce replay: this nonce has already been used by this provider',
          execution_id: receipt.execution_reference.execution_id,
        }, { status: 409 })
      }
      // Concurrent duplicate event ID — idempotent success, no mutation
      return NextResponse.json({
        accepted: true,
        idempotent: true,
        execution_id: receipt.execution_reference.execution_id,
        execution_status: receipt.status,
        exchange_state: record.state,
        authoritative_exchange_state_advanced: false,
      })
    }
    return NextResponse.json({ error: 'Execution receipt persistence failed', detail: receiptError.message }, { status: 500 })
  }

  // ─── Update execution state with optimistic concurrency ───
  // Only advance state on a forward (non-duplicate) transition.
  // { count: 'exact' } is required so the PostgREST response includes the
  // affected-row count. Without it, count is null and a CAS miss (another
  // callback won the race) is undetectable — the response would report the
  // attempted state instead of the actual persisted state.
  let finalExecutionState: string = newState
  if (!transition.is_duplicate) {
    const { error: executionError, count } = await admin.from('exchange_executions')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
        state_version: (execution.state_version ?? 0) + 1,
      }, { count: 'exact' })
      .eq('execution_id', receipt.execution_reference.execution_id)
      .eq('exchange_id', record.id)
      .eq('state_version', execution.state_version ?? 0)

    if (executionError) return NextResponse.json({ error: 'Execution state update failed' }, { status: 500 })
    // count === 0 → CAS miss (another callback advanced state_version first).
    // count === null → PostgREST did not return a count; treat as a miss too
    // and re-read, since we cannot confirm the update applied.
    if (count === 0 || count === null) {
      // Optimistic concurrency conflict — another callback won the race, or
      // the count was unavailable. The receipt is stored as evidence; re-read
      // the actual current state so the response reflects what was actually
      // persisted, not what we attempted.
      const { data: current } = await admin.from('exchange_executions')
        .select('state')
        .eq('execution_id', receipt.execution_reference.execution_id)
        .eq('exchange_id', record.id)
        .maybeSingle()
      finalExecutionState = current?.state ?? newState
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
          attempted_state: newState,
          actual_state: finalExecutionState,
          reason: count === 0
            ? 'state_version mismatch — another callback advanced state first'
            : 'affected-row count unavailable — re-read canonical state',
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
    execution_state: finalExecutionState,
    exchange_state: record.state,
    authoritative_exchange_state_advanced: false,
    next: receipt.status === 'delivered' || receipt.status === 'verified'
      ? 'Use the governed exchange transition endpoint to evaluate and advance Contribution Exchange state independently.'
      : undefined,
  })
}
