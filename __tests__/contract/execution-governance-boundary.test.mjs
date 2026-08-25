import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')
const receiptRoute = readFileSync(resolve(root, 'app/api/exchange/exchanges/[id]/execution/receipt/route.ts'), 'utf8')
const executeRoute = readFileSync(resolve(root, 'app/api/exchange/exchanges/[id]/execute/route.ts'), 'utf8')
const router = readFileSync(resolve(root, 'exchange-gateway/src/execution-router.ts'), 'utf8')

test('execution receipts cannot advance authoritative Contribution Exchange state', () => {
  assert.doesNotMatch(receiptRoute, /from\('exchange_records'\)\.update\(\{ state:/)
  assert.match(receiptRoute, /authoritative_exchange_state_advanced:\s*false/)
  assert.match(receiptRoute, /Use the governed exchange transition endpoint/)
})

test('receipt ingestion binds provider identity to the persisted execution', () => {
  assert.match(receiptRoute, /receipt\.provider\s*!==\s*execution\.provider/)
  assert.match(receiptRoute, /receipt\.execution_reference\.provider\s*!==\s*execution\.provider/)
  assert.match(receiptRoute, /receipt\.provider_reference\s*!==\s*execution\.provider_reference/)
  assert.match(receiptRoute, /External execution receipts require a cryptographic provider signature/)
})

test('company-admin execution route marks principal approval explicitly', () => {
  assert.match(executeRoute, /principal_approved:\s*true/)
  assert.match(executeRoute, /execution_created:\s*false/)
  assert.match(executeRoute, /Execution was created by the provider but could not be persisted/)
})

test('execution router fails closed instead of silently self-executing external-provider failures', () => {
  assert.match(router, /Contribution Commitment is missing a finalized terms hash; execution is blocked/)
  assert.match(router, /domain policy requires principal approval before execution routing/)
  assert.match(router, /not registered; no fallback execution was created/)
  assert.match(router, /cannot execute; no fallback execution was created/)
  assert.match(router, /failed to create execution; no fallback execution was created/)
  assert.doesNotMatch(router, /falling back to internal self-execution/)
})
