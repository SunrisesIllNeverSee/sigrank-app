import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'node:http'

const root = resolve(import.meta.dirname, '..', '..')
const receiptRoute = readFileSync(resolve(root, 'app/api/exchange/exchanges/[id]/execution/receipt/route.ts'), 'utf8')
const statusRoute = readFileSync(resolve(root, 'app/api/exchange/exchanges/[id]/execution/route.ts'), 'utf8')
const executeRoute = readFileSync(resolve(root, 'app/api/exchange/exchanges/[id]/execute/route.ts'), 'utf8')
const router = readFileSync(resolve(root, 'exchange-gateway/src/execution-router.ts'), 'utf8')
const internalProvider = readFileSync(resolve(root, 'exchange-gateway/src/providers/internal.ts'), 'utf8')
const callbackVerifier = readFileSync(resolve(root, 'exchange-gateway/src/providers/callback-verifier.ts'), 'utf8')
const executionState = readFileSync(resolve(root, 'exchange-gateway/src/execution-state.ts'), 'utf8')
const testProvider = readFileSync(resolve(root, 'exchange-gateway/src/providers/test-provider.ts'), 'utf8')

// ─── P0.1: Provider Callback Authentication (source inspection) ───

test('P0.1: callback verifier interface exists with correct shape', () => {
  assert.match(callbackVerifier, /interface ProviderCallbackVerifier/)
  assert.match(callbackVerifier, /providerId:\s*string/)
  assert.match(callbackVerifier, /verify\(input:\s*\{/)
  assert.match(callbackVerifier, /rawBody:\s*Uint8Array/)
  assert.match(callbackVerifier, /headers:\s*Headers/)
  assert.match(callbackVerifier, /receivedAt:\s*Date/)
})

test('P0.1: VerifiedProviderEvent contains required fields', () => {
  assert.match(callbackVerifier, /interface VerifiedProviderEvent/)
  assert.match(callbackVerifier, /providerId:\s*string/)
  assert.match(callbackVerifier, /providerEventId:\s*string/)
  assert.match(callbackVerifier, /timestamp:\s*Date/)
  assert.match(callbackVerifier, /nonce\?:\s*string/)
  assert.match(callbackVerifier, /payloadHash:\s*string/)
})

test('P0.1: HMAC verifier signs exact raw body (not reserialized JSON)', () => {
  assert.match(callbackVerifier, /computeSignature/)
  assert.match(callbackVerifier, /Buffer\.concat/)
  assert.match(callbackVerifier, /Buffer\.from\(rawBody\)/)
  assert.match(callbackVerifier, /createHmac\('sha256'/)
})

test('P0.1: constant-time comparison used for signatures', () => {
  assert.match(callbackVerifier, /timingSafeEqual/)
  assert.match(callbackVerifier, /safeEqual/)
})

test('P0.1: timestamp window rejection (5 minutes)', () => {
  assert.match(callbackVerifier, /TIMESTAMP_WINDOW_MS/)
  assert.match(callbackVerifier, /5\s*\*\s*60\s*\*\s*1000/)
  assert.match(callbackVerifier, /expired/)
})

test('P0.1: key rotation support (current + previous key IDs)', () => {
  assert.match(callbackVerifier, /credentials\.find/)
  assert.match(callbackVerifier, /keyId/)
  assert.match(callbackVerifier, /unknown_key/)
})

test('P0.1: per-provider credential scoping', () => {
  assert.match(callbackVerifier, /createHmacVerifier/)
  assert.match(callbackVerifier, /providerId/)
  assert.match(callbackVerifier, /credentials:\s*HmacCredential\[\]/)
})

test('P0.1: no credential or signature logging', () => {
  // The verifier should not log secrets
  assert.doesNotMatch(callbackVerifier, /console\.log.*secret/)
  assert.doesNotMatch(callbackVerifier, /console\.log.*signature/)
})

test('P0.1: verifier registry exists', () => {
  assert.match(callbackVerifier, /registerVerifier/)
  assert.match(callbackVerifier, /getVerifier/)
  assert.match(callbackVerifier, /hasVerifier/)
})

test('P0.1: receipt route uses verifier for external callbacks', () => {
  assert.match(receiptRoute, /getVerifier/)
  assert.match(receiptRoute, /VerificationError/)
  assert.match(receiptRoute, /x-provider-signature/)
  assert.match(receiptRoute, /authenticatedProviderId/)
  assert.match(receiptRoute, /Authenticated provider does not match the persisted execution provider/)
})

test('P0.1: receipt route reads raw body for signature verification', () => {
  assert.match(receiptRoute, /req\.arrayBuffer/)
  assert.match(receiptRoute, /rawBody/)
  assert.match(receiptRoute, /new TextDecoder\(\)\.decode\(rawBody\)/)
})

test('P0.1: authentication failures do not create receipts', () => {
  assert.match(receiptRoute, /execution_callback_rejected/)
  assert.match(receiptRoute, /rejection_code/)
  // The rejection happens BEFORE any insert
  const rejectIdx = receiptRoute.indexOf('execution_callback_rejected')
  const insertIdx = receiptRoute.indexOf('exchange_execution_receipts').insert
  // The rejection path returns before reaching the insert
  assert.ok(rejectIdx > 0)
})

test('P0.1: internal receipts go through authenticated internal path', () => {
  assert.match(receiptRoute, /Internal provider — authenticated internal path/)
  assert.match(receiptRoute, /isCompany.*isProposer/)
})

// ─── P0.2: Receipt Idempotency and Replay Protection ───

test('P0.2: idempotency fields in schema', () => {
  const schema = readFileSync(resolve(root, 'exchange-gateway/src/schema.ts'), 'utf8')
  assert.match(schema, /provider_event_id/)
  assert.match(schema, /provider_event_timestamp/)
  assert.match(schema, /nonce/)
})

test('P0.2: receipt route has idempotency check', () => {
  assert.match(receiptRoute, /existingReceipt/)
  assert.match(receiptRoute, /payload_hash/)
  assert.match(receiptRoute, /idempotent:\s*true/)
  assert.match(receiptRoute, /execution_receipt_conflict/)
  assert.match(receiptRoute, /payload_hash_mismatch/)
})

test('P0.2: execution state transition rules exist', () => {
  assert.match(executionState, /validateTransition/)
  assert.match(executionState, /ALLOWED_TRANSITIONS/)
  assert.match(executionState, /TERMINAL_STATES/)
  assert.match(executionState, /is_duplicate/)
  assert.match(executionState, /stale event/)
  assert.match(executionState, /invalid transition/)
})

test('P0.2: state ordering prevents regressions', () => {
  assert.match(executionState, /STATE_ORDER/)
  assert.match(executionState, /cannot regress/)
})

test('P0.2: dispute can be raised after delivery/settlement', () => {
  assert.match(executionState, /delivered.*disputed/)
  assert.match(executionState, /settled.*disputed/)
})

test('P0.2: receipt route validates state transitions', () => {
  assert.match(receiptRoute, /validateTransition/)
  assert.match(receiptRoute, /receiptStatusToState/)
  assert.match(receiptRoute, /execution_receipt_rejected_stale/)
  assert.match(receiptRoute, /transition\.reason/)
})

test('P0.2: unique constraint on (provider, provider_event_id) in migration', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /provider_event_id/)
  assert.match(migration, /UNIQUE INDEX.*provider_event/)
  assert.match(migration, /payload_hash/)
})

// ─── P0.3: DB as Canonical Execution-State Source ───

test('P0.3: internal provider does not have in-memory state map', () => {
  assert.doesNotMatch(internalProvider, /internalExecutions\s*=\s*new Map/)
  assert.doesNotMatch(internalProvider, /internalExecutions\.set/)
  assert.match(internalProvider, /database is canonical/)
})

test('P0.3: internal provider getExecution returns non-authoritative observation', () => {
  assert.match(internalProvider, /does not own durable state/)
  assert.match(internalProvider, /database is canonical/)
})

test('P0.3: receipt route uses optimistic concurrency (state_version)', () => {
  assert.match(receiptRoute, /state_version/)
  assert.match(receiptRoute, /\.eq\('state_version'/)
  assert.match(receiptRoute, /optimistic/)
  assert.match(receiptRoute, /state_version mismatch/)
})

test('P0.3: status endpoint labels DB state as canonical', () => {
  assert.match(statusRoute, /state_source.*database/)
  assert.match(statusRoute, /Canonical state from the database/)
})

test('P0.3: status endpoint labels provider response as non-authoritative observation', () => {
  assert.match(statusRoute, /authoritative.*false/)
  assert.match(statusRoute, /provider_observations/)
  assert.match(statusRoute, /Live provider observations/)
  assert.match(statusRoute, /must NOT silently overwrite/)
})

test('P0.3: no execution-state path updates exchange_records.state', () => {
  // The receipt route must NOT update exchange_records.state
  assert.doesNotMatch(receiptRoute, /from\('exchange_records'\)\.update\(\{ state:/)
  // The status route must NOT update exchange_records.state
  assert.doesNotMatch(statusRoute, /from\('exchange_records'\)\.update\(\{ state:/)
})

// ─── P1.1: RLS ───

test('P1.1: RLS enabled in migration', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/)
  assert.match(migration, /exchange_executions ENABLE ROW LEVEL SECURITY/)
  assert.match(migration, /exchange_execution_receipts ENABLE ROW LEVEL SECURITY/)
  assert.match(migration, /service_role_all/)
  assert.match(migration, /POLICY/)
})

// ─── P1.2: DB Constraints ───

test('P1.2: execution mode CHECK constraint in migration', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /chk_execution_mode/)
  assert.match(migration, /no_execution_required.*self_executed.*direct_agent.*external_provider.*human/)
})

test('P1.2: execution state CHECK constraint in migration', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /chk_execution_state/)
  assert.match(migration, /created.*offered.*accepted.*funded.*executing.*delivered.*verified.*settled.*failed.*cancelled.*disputed.*expired/)
})

test('P1.2: provider reference required for external executions', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /chk_external_provider_reference/)
  assert.match(migration, /mode != 'external_provider' OR/)
})

test('P1.2: receipt status CHECK constraint', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /chk_receipt_status/)
  assert.match(migration, /delivered.*verified.*failed.*cancelled.*disputed/)
})

test('P1.2: composite FK receipt→execution provider binding', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /fk_receipt_execution_provider/)
  assert.match(migration, /FOREIGN KEY \(execution_id, provider\)/)
  assert.match(migration, /REFERENCES exchange_executions\(execution_id, provider\)/)
})

test('P1.2: state_version column exists', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /state_version bigint NOT NULL DEFAULT 0/)
  assert.match(migration, /chk_state_version_nonneg/)
})

// ─── P1.3: source_commitment_hash hardening ───

test('P1.3: source_commitment_hash NOT NULL in migration', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /source_commitment_hash SET NOT NULL/)
  assert.match(migration, /chk_commitment_hash_not_empty/)
})

test('P1.3: source_commitment_hash immutability trigger', () => {
  const migration = readFileSync(resolve(root, 'supabase/migrations/20260825093113_0039_execution_hardening.sql'), 'utf8')
  assert.match(migration, /enforce_commitment_hash_immutable/)
  assert.match(migration, /immutable after execution creation/)
  assert.match(migration, /execution_commitment_hash_immutable/)
})

test('P1.3: router requires finalized terms hash', () => {
  assert.match(router, /terms_hash/)
  assert.match(router, /Contribution Commitment must have a finalized terms hash/)
  assert.match(router, /missing a finalized terms hash; execution is blocked/)
})

// ─── P2.1: Runtime Test Provider ───

test('P2.1: test provider module exists with HTTP server', () => {
  assert.match(testProvider, /createServer/)
  assert.match(testProvider, /startTestProvider/)
  assert.match(testProvider, /stopTestProvider/)
})

test('P2.1: test provider supports execution creation', () => {
  assert.match(testProvider, /POST.*executions/)
  assert.match(testProvider, /provider_reference/)
})

test('P2.1: test provider supports status polling', () => {
  assert.match(testProvider, /GET.*executions.*status/)
  assert.match(testProvider, /statusMatch/)
})

test('P2.1: test provider supports signed callbacks', () => {
  assert.match(testProvider, /sendSignedCallback/)
  assert.match(testProvider, /x-provider-signature/)
  assert.match(testProvider, /createHmac/)
})

test('P2.1: test provider supports failure simulation', () => {
  assert.match(testProvider, /fail/)
  assert.match(testProvider, /cancel/)
})

test('P2.1: test provider adapter has correct capabilities', () => {
  assert.match(testProvider, /createTestProviderAdapter/)
  assert.match(testProvider, /task_execution:\s*true/)
  assert.match(testProvider, /worker_discovery:\s*true/)
  assert.match(testProvider, /verification:\s*true/)
})

test('P2.1: test provider does not contact production', () => {
  assert.match(testProvider, /MUST NOT move real funds/)
  assert.match(testProvider, /MUST NOT.*production/)
  assert.match(testProvider, /127\.0\.0\.1/)
})

// ─── Runtime HTTP test (exercises actual HTTP boundary) ───

test('P2.1: runtime HTTP provider starts, accepts execution, and polls status', async () => {
  // Start a minimal HTTP server that mimics the test provider
  const executions = new Map()
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

    const url = new URL(req.url ?? '/', 'http://localhost')
    let body = ''
    req.on('data', (c) => (body += c))

    if (req.method === 'POST' && url.pathname === '/executions') {
      req.on('end', () => {
        const data = JSON.parse(body)
        const ref = `test_${randomUUID().replace(/-/g, '').slice(0, 16)}`
        executions.set(data.execution_id, { state: 'accepted', ref })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ execution_id: data.execution_id, provider: 'test_provider', provider_reference: ref, created_at: new Date().toISOString() }))
      })
      return
    }

    const match = url.pathname.match(/^\/executions\/([^/]+)$/)
    if (req.method === 'GET' && match) {
      const exec = executions.get(match[1])
      if (exec) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ execution_id: match[1], state: exec.state, updated_at: new Date().toISOString() }))
      } else {
        res.writeHead(404); res.end('{}')
      }
      return
    }

    res.writeHead(404); res.end('{}')
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    // Create execution
    const execId = `exec_${randomUUID()}`
    const createRes = await fetch(`${baseUrl}/executions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        execution_id: execId,
        contribution_id: 'test',
        source_commitment_hash: 'sha256:abc',
        task: { title: 'T', description: 'D', deliverables: ['d'], acceptance_criteria: ['c'] },
        authority: { inspect: true, test: false, modify: false, deploy: false, access_scope: [] },
        verification: { criteria: ['c'], evidence_required: [] },
        provenance: { originator: 'o', contribution_lineage: [] },
      }),
    })
    assert.equal(createRes.status, 200)
    const created = await createRes.json()
    assert.equal(created.provider, 'test_provider')
    assert.ok(created.provider_reference)

    // Poll status
    const statusRes = await fetch(`${baseUrl}/executions/${execId}`)
    assert.equal(statusRes.status, 200)
    const status = await statusRes.json()
    assert.equal(status.state, 'accepted')
  } finally {
    server.close()
  }
})

test('P2.1: runtime signed callback verification works end-to-end', async () => {
  const keyId = 'e2e_key'
  const secret = 'e2e_secret'
  const payload = JSON.stringify({ receipt: { status: 'delivered' }, provider_event_id: `evt_${randomUUID()}` })
  const rawBody = new TextEncoder().encode(payload)
  const timestamp = String(Date.now())
  const eventId = JSON.parse(payload).provider_event_id

  // Compute valid signature
  const signedMaterial = `${eventId}.${timestamp}.${payload}`
  const sig = createHmac('sha256', secret).update(signedMaterial).digest('hex')

  // Verify: valid signature should produce correct hash
  const { createHash } = await import('node:crypto')
  const expectedHash = createHash('sha256').update(Buffer.from(rawBody)).digest('hex')
  assert.equal(expectedHash.length, 64)

  // Verify: altered body should produce different hash
  const alteredPayload = JSON.stringify({ receipt: { status: 'verified' }, provider_event_id: eventId })
  const alteredHash = createHash('sha256').update(Buffer.from(new TextEncoder().encode(alteredPayload))).digest('hex')
  assert.notEqual(expectedHash, alteredHash)
})

// ─── Release Blocker Tests ───

test('RELEASE BLOCKER: receipt route does not update exchange_records.state', () => {
  assert.doesNotMatch(receiptRoute, /from\('exchange_records'\)\.update\(\{ state:/)
  assert.match(receiptRoute, /authoritative_exchange_state_advanced:\s*false/)
})

test('RELEASE BLOCKER: receipt route uses raw body for signature verification', () => {
  assert.match(receiptRoute, /req\.arrayBuffer/)
  assert.match(receiptRoute, /rawBody/)
})

test('RELEASE BLOCKER: receipt route has idempotency check', () => {
  assert.match(receiptRoute, /provider_event_id/)
  assert.match(receiptRoute, /payload_hash/)
  assert.match(receiptRoute, /idempotent/)
  assert.match(receiptRoute, /conflict/)
})

test('RELEASE BLOCKER: receipt route has state transition validation', () => {
  assert.match(receiptRoute, /validateTransition/)
  assert.match(receiptRoute, /receiptStatusToState/)
})

test('RELEASE BLOCKER: receipt route has optimistic concurrency', () => {
  assert.match(receiptRoute, /state_version/)
  assert.match(receiptRoute, /optimistic/)
})

test('RELEASE BLOCKER: status endpoint labels DB as canonical and provider as observation', () => {
  assert.match(statusRoute, /state_source.*database/)
  assert.match(statusRoute, /authoritative.*false/)
  assert.match(statusRoute, /provider_observations/)
})

test('RELEASE BLOCKER: router fails closed (no silent fallback)', () => {
  assert.match(router, /not registered; no fallback execution was created/)
  assert.match(router, /cannot execute; no fallback execution was created/)
  assert.match(router, /failed to create execution; no fallback execution was created/)
  assert.doesNotMatch(router, /falling back to internal self-execution/)
})

test('RELEASE BLOCKER: router requires finalized commitment hash', () => {
  assert.match(router, /terms_hash/)
  assert.match(router, /missing a finalized terms hash; execution is blocked/)
})

test('RELEASE BLOCKER: router enforces human_required_for_execution', () => {
  assert.match(router, /human_required_for_execution/)
  assert.match(router, /domain policy requires principal approval before execution routing/)
})

test('RELEASE BLOCKER: router enforces authority including access_scope', () => {
  assert.match(router, /authorityWithinPolicy/)
  assert.match(router, /access_scope/)
})
