import test from 'node:test'
import assert from 'node:assert/strict'

// ─── Runtime tests for the external provider adapter scaffold ───
//
// These tests verify that the adapter scaffold:
// 1. Correctly implements the ExecutionProvider interface
// 2. Enforces authorization non-expansion (defense-in-depth)
// 3. Returns properly typed ExecutionReference, ExecutionStatus, ExecutionReceipt
// 4. Fail-closed on unknown provider result statuses
// 5. Maps provider states to the normalized lifecycle correctly

import {
  createExternalProviderAdapter,
  mapProviderStateToNormalized,
  mapProviderResultToReceiptStatus,
} from '../../exchange-gateway/src/providers/external-provider-adapter.ts'

// ─── Test config ───

const TEST_CONFIG = {
  providerId: 'scaffold_test',
  baseUrl: 'https://api.test-provider.example.com/v1',
  apiKey: 'test_key_not_real',
  capabilities: {
    task_execution: true,
    worker_discovery: true,
    escrow: false,
    collateral: false,
    verification: true,
    arbitration: false,
    agent_messaging: true,
    programmable_splits: false,
    fiat_settlement: false,
    crypto_settlement: false,
  },
}

// ─── Helpers ───

function makeCommitment(overrides = {}) {
  return {
    version: '0.1',
    contribution_id: 'contrib_test_001',
    origin: { type: 'ambient_observation', description: 'documentation typo' },
    parties: {
      contributor: { type: 'agent', id: 'agent-001' },
      recipient: { type: 'domain', id: 'signalaf.com' },
    },
    contribution: {
      type: 'documentation',
      title: 'Fix README typo',
      description: 'Fix a typo in the README',
      disclosure_state: 'authorized',
    },
    consideration: [{ type: 'cash', amount: 50, currency: 'USD' }],
    rights: {
      owner: 'signalaf.com',
      pre_vesting: { license: 'MIT', deploy: 'prohibited' },
      post_vesting: { license: 'MIT', deploy: 'permitted' },
    },
    vesting: { requires: ['authorization', 'delivery', 'verification'] },
    authorization: {
      inspect: true,
      test: true,
      modify: false,
      deploy: false,
    },
    verification: {
      criteria: ['Typo is fixed', 'No other changes'],
      evidence: ['diff'],
    },
    settlement: { status: 'not_required' },
    revocation: {
      authorization: 'revocable',
      access: 'revocable',
      license_pre_vesting: 'withdrawable',
      license_post_vesting: 'nonrevocable',
      artifact_recall: 'not_guaranteed',
    },
    provenance: {
      terms_hash: 'sha256:abc123',
    },
    ...overrides,
  }
}

function makeExecutionRequest(overrides = {}) {
  return {
    execution_id: 'exec_test_001',
    contribution_id: 'contrib_test_001',
    source_commitment_hash: 'sha256:abc123',
    task: {
      title: 'Fix README typo',
      description: 'Fix a typo in the README',
      deliverables: ['Corrected README.md'],
      acceptance_criteria: ['Typo is fixed', 'No other changes'],
    },
    budget: { amount: 50, currency: 'USD' },
    authority: {
      inspect: true,
      test: true,
      modify: false,
      deploy: false,
      access_scope: [],
    },
    verification: {
      criteria: ['Typo is fixed', 'No other changes'],
      evidence_required: ['diff'],
    },
    deadline: '2026-09-01T00:00:00Z',
    provenance: {
      originator: 'agent-001',
      contribution_lineage: [],
    },
    ...overrides,
  }
}

// ─── Tests ───

test('adapter implements the ExecutionProvider interface', () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  assert.equal(adapter.id, 'scaffold_test')
  assert.equal(typeof adapter.capabilities, 'function')
  assert.equal(typeof adapter.canExecute, 'function')
  assert.equal(typeof adapter.createExecution, 'function')
  assert.equal(typeof adapter.getExecution, 'function')
  assert.equal(typeof adapter.cancelExecution, 'function')
  assert.equal(typeof adapter.verifyExecution, 'function')
})

test('adapter capabilities return a copy, not a shared reference', () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const caps1 = adapter.capabilities()
  const caps2 = adapter.capabilities()
  caps1.task_execution = false
  assert.equal(caps2.task_execution, true, 'modifying one capabilities return value must not affect subsequent calls')
})

test('adapter has the correct id matching the config', () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  assert.equal(adapter.id, 'scaffold_test')
  // The adapter is designed to be registered via registerProvider(adapter)
  // from execution-router.ts. We test the interface contract here without
  // importing the router (which has extensionless internal imports that
  // Node's ESM loader cannot resolve outside the Next.js bundler).
})

test('adapter accepts work within commitment authorization', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const commitment = makeCommitment()
  const request = makeExecutionRequest()
  const assessment = await adapter.canExecute(commitment, request)
  assert.equal(assessment.can_execute, true)
  assert.ok(assessment.reasons.length > 0)
})

test('adapter refuses to expand authorization: deploy not granted by commitment', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const commitment = makeCommitment({
    authorization: { inspect: true, test: true, modify: false, deploy: false },
  })
  const request = makeExecutionRequest({
    authority: { inspect: true, test: true, modify: false, deploy: true, access_scope: [] },
  })
  const assessment = await adapter.canExecute(commitment, request)
  assert.equal(assessment.can_execute, false)
  assert.ok(assessment.reasons.some((r) => r.includes('deploy')))
})

test('adapter refuses to expand authorization: modify not granted by commitment', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const commitment = makeCommitment({
    authorization: { inspect: true, test: true, modify: false, deploy: false },
  })
  const request = makeExecutionRequest({
    authority: { inspect: true, test: true, modify: true, deploy: false, access_scope: [] },
  })
  const assessment = await adapter.canExecute(commitment, request)
  assert.equal(assessment.can_execute, false)
  assert.ok(assessment.reasons.some((r) => r.includes('modify')))
})

test('adapter createExecution returns a properly typed ExecutionReference', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const request = makeExecutionRequest()
  const reference = await adapter.createExecution(request)
  assert.equal(reference.execution_id, request.execution_id)
  assert.equal(reference.provider, 'scaffold_test')
  assert.ok(reference.provider_reference, 'provider_reference must be present')
  assert.ok(reference.created_at, 'created_at must be present')
})

test('adapter getExecution returns a non-authoritative observation', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const reference = {
    execution_id: 'exec_test_001',
    provider: 'scaffold_test',
    provider_reference: 'ext_abc123',
    created_at: new Date().toISOString(),
  }
  const status = await adapter.getExecution(reference)
  assert.equal(status.reference, reference)
  assert.ok(status.state, 'state must be present')
  assert.ok(status.updated_at, 'updated_at must be present')
  assert.ok(status.provider_state, 'provider_state must be present for audit')
})

test('adapter verifyExecution fails closed when provider API is not wired', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const reference = {
    execution_id: 'exec_test_001',
    provider: 'scaffold_test',
    provider_reference: 'ext_abc123',
    created_at: new Date().toISOString(),
  }
  // The scaffold must NOT return a positive receipt status for an
  // unimplemented verification call. It must throw so that accidental
  // activation (someone registers the adapter without filling in the
  // provider API) is loud and immediate, not silently accepted.
  await assert.rejects(
    () => adapter.verifyExecution(reference),
    /verifyExecution not implemented/,
  )
})

test('adapter cancelExecution does not throw', async () => {
  const adapter = createExternalProviderAdapter(TEST_CONFIG)
  const reference = {
    execution_id: 'exec_test_001',
    provider: 'scaffold_test',
    provider_reference: 'ext_abc123',
    created_at: new Date().toISOString(),
  }
  await adapter.cancelExecution(reference)
  // No assertion needed — if it doesn't throw, the test passes
})

// ─── State mapping tests ───

test('mapProviderStateToNormalized maps common provider states correctly', () => {
  assert.equal(mapProviderStateToNormalized('created'), 'created')
  assert.equal(mapProviderStateToNormalized('pending'), 'created')
  assert.equal(mapProviderStateToNormalized('offered'), 'offered')
  assert.equal(mapProviderStateToNormalized('queued'), 'offered')
  assert.equal(mapProviderStateToNormalized('accepted'), 'accepted')
  assert.equal(mapProviderStateToNormalized('claimed'), 'accepted')
  assert.equal(mapProviderStateToNormalized('funded'), 'funded')
  assert.equal(mapProviderStateToNormalized('escrow_held'), 'funded')
  assert.equal(mapProviderStateToNormalized('executing'), 'executing')
  assert.equal(mapProviderStateToNormalized('in_progress'), 'executing')
  assert.equal(mapProviderStateToNormalized('running'), 'executing')
  assert.equal(mapProviderStateToNormalized('delivered'), 'delivered')
  assert.equal(mapProviderStateToNormalized('completed'), 'delivered')
  assert.equal(mapProviderStateToNormalized('verified'), 'verified')
  assert.equal(mapProviderStateToNormalized('under_review'), 'verified')
  assert.equal(mapProviderStateToNormalized('settled'), 'settled')
  assert.equal(mapProviderStateToNormalized('paid'), 'settled')
  assert.equal(mapProviderStateToNormalized('failed'), 'failed')
  assert.equal(mapProviderStateToNormalized('error'), 'failed')
  assert.equal(mapProviderStateToNormalized('cancelled'), 'cancelled')
  assert.equal(mapProviderStateToNormalized('disputed'), 'disputed')
  assert.equal(mapProviderStateToNormalized('rejected'), 'disputed')
  assert.equal(mapProviderStateToNormalized('expired'), 'expired')
  assert.equal(mapProviderStateToNormalized('timeout'), 'expired')
})

test('mapProviderStateToNormalized defaults to created for unknown states', () => {
  assert.equal(mapProviderStateToNormalized('unknown_weird_state'), 'created')
  assert.equal(mapProviderStateToNormalized(''), 'created')
})

test('mapProviderResultToReceiptStatus maps common results correctly', () => {
  assert.equal(mapProviderResultToReceiptStatus('delivered'), 'delivered')
  assert.equal(mapProviderResultToReceiptStatus('completed'), 'delivered')
  assert.equal(mapProviderResultToReceiptStatus('success'), 'delivered')
  assert.equal(mapProviderResultToReceiptStatus('verified'), 'verified')
  assert.equal(mapProviderResultToReceiptStatus('under_review'), 'verified')
  assert.equal(mapProviderResultToReceiptStatus('cancelled'), 'cancelled')
  assert.equal(mapProviderResultToReceiptStatus('disputed'), 'disputed')
  assert.equal(mapProviderResultToReceiptStatus('rejected'), 'disputed')
})

test('mapProviderResultToReceiptStatus fails closed on unknown results', () => {
  assert.equal(mapProviderResultToReceiptStatus('unknown_result'), 'failed')
  assert.equal(mapProviderResultToReceiptStatus(''), 'failed')
  assert.equal(mapProviderResultToReceiptStatus('weird_status'), 'failed')
})
