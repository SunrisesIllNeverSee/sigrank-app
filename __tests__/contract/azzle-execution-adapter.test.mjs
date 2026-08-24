import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const execution = fs.readFileSync('exchange-gateway/src/execution.ts', 'utf8')
const azzle = fs.readFileSync('exchange-gateway/src/adapters/azzle.ts', 'utf8')
const guide = fs.readFileSync('docs/exchange/AZZLE_EXECUTION_ADAPTER.md', 'utf8')

test('external execution handoff preserves Contribution Exchange authority boundaries', () => {
  assert.match(execution, /authorization_required_before_provider_post: true/)
  assert.match(execution, /provider_completion_is_local_verification: false/)
  assert.match(execution, /provider_settlement_is_local_settlement: false/)
  assert.match(execution, /rights_remain_governed_by_contribution_commitment: true/)
  assert.match(execution, /explicit_execution_budget/)
  assert.match(execution, /requires a frozen Contribution Commitment terms_hash/)
})

test('AZZLE V2 mapping uses the canonical eight-state contract model', () => {
  for (const pair of [
    ['NONE', '0'],
    ['POSTED', '1'],
    ['CLAIMED', '2'],
    ['ACTIVE', '3'],
    ['DISPUTED', '4'],
    ['COMPLETED', '5'],
    ['CANCELLED', '6'],
    ['RESOLVED', '7'],
  ]) {
    assert.match(azzle, new RegExp(`${pair[0]}: ${pair[1]}`))
  }
  assert.match(azzle, /case 'COMPLETED': return 'provider_completed'/)
  assert.doesNotMatch(azzle, /case 'COMPLETED': return 'verified'/)
})

test('AZZLE adapter resolves mutable provider infrastructure at runtime', () => {
  assert.match(azzle, /manifest_resolution: 'runtime_required'/)
  assert.match(azzle, /api\/site-config\?market=/)
  assert.match(azzle, /sdk_package: '@azzle\/agents'/)
  assert.match(azzle, /sdk_manifest: 'loadMarketManifest'/)
  assert.match(azzle, /chain_id: 8453/)
})

test('AZZLE adapter defaults to private negotiation instead of disclosing protected contribution text', () => {
  assert.match(azzle, /input\.scopeMode \?\? 'private_xmtp'/)
  assert.match(azzle, /protected_contribution_text_is_not_auto_disclosed: true/)
  assert.match(guide, /Protected contribution text is never copied into a public task automatically/)
})

test('integration guide keeps originator, executor and Exchange economics separate', () => {
  assert.match(guide, /discovery\/originator economics/)
  assert.match(guide, /execution economics/)
  assert.match(guide, /Contribution Exchange platform economics/)
  assert.match(guide, /Do not silently charge the Exchange percentage/)
})
