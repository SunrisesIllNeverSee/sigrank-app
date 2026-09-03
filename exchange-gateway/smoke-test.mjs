#!/usr/bin/env node
/**
 * exchange-gateway/smoke-test.mjs — live end-to-end smoke test for the Contribution Exchange.
 *
 * Verifies the full agent↔domain exchange flow against a deployed environment:
 *   1. Domain exchange manifest (/.well-known/exchange.json)
 *   2. Central manifest (/api/exchange/manifest)
 *   3. Hosted Steward policy (/api/exchange/steward/<domain>)
 *   4. Overview page (/exchange)
 *   5. Proposal submission (POST /api/exchange/proposals)
 *   6. Steward auto-engagement + state transition
 *
 * Usage:
 *   node exchange-gateway/smoke-test.mjs                          # defaults to signalaf.com
 *   node exchange-gateway/smoke-test.mjs --base https://signalaf.com --domain mos2es.xyz
 *   node exchange-gateway/smoke-test.mjs --base http://localhost:3000 --domain mos2es.xyz
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = flag('base', 'https://signalaf.com').replace(/\/$/, '');
const DOMAIN = flag('domain', 'mos2es.xyz');

let passed = 0;
let failed = 0;
let proposalKey = null;
let proposalId = null;

function ok(name, detail) {
  passed++;
  console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  failed++;
  console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
}

async function json(method, url, body) {
  const headers = { 'Accept': 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, raw: text };
}

async function run() {
  console.log(`\nContribution Exchange — smoke test`);
  console.log(`  Base:   ${BASE}`);
  console.log(`  Domain: ${DOMAIN}\n`);

  // ── 1. Domain exchange manifest ──────────────────────────────────────
  console.log('1. Domain exchange manifest');
  {
    const domainBase = `https://${DOMAIN}`;
    const { status, data } = await json('GET', `${domainBase}/.well-known/exchange.json`);
    if (status !== 200) {
      fail('exchange.json', `HTTP ${status}`);
    } else if (data.protocol !== 'Contribution Exchange') {
      fail('exchange.json', `unexpected protocol: ${data.protocol}`);
    } else if (data.version !== '0.2') {
      fail('exchange.json', `unexpected version: ${data.version}`);
    } else if (data.counterparty_agent?.mode !== 'hosted_steward') {
      fail('exchange.json', `steward mode: ${data.counterparty_agent?.mode}`);
    } else {
      ok('exchange.json', `v${data.version}, ${data.counterparty_agent.mode}`);
    }
  }

  // ── 2. Central manifest ──────────────────────────────────────────────
  console.log('2. Central manifest');
  {
    const { status, data } = await json('GET', `${BASE}/api/exchange/manifest`);
    if (status !== 200) {
      fail('manifest', `HTTP ${status}`);
    } else if (data.protocol !== 'Contribution Exchange') {
      fail('manifest', `unexpected protocol: ${data.protocol}`);
    } else if (data.version !== '0.2') {
      fail('manifest', `unexpected version: ${data.version}`);
    } else {
      ok('manifest', `v${data.version}, status: ${data.status}`);
    }
  }

  // ── 3. Hosted Steward policy ─────────────────────────────────────────
  console.log('3. Hosted Steward policy');
  {
    const { status, data } = await json('GET', `${BASE}/api/exchange/steward/${DOMAIN}`);
    if (status !== 200) {
      fail('steward', `HTTP ${status}`);
    } else if (data.mode !== 'hosted_steward') {
      fail('steward', `mode: ${data.mode}`);
    } else if (!data.policy?.auto_engage?.enabled) {
      fail('steward', `auto_engage not enabled`);
    } else if (data.policy?.human_required_for_commitment !== true) {
      fail('steward', `human_required_for_commitment should be true`);
    } else if (data.policy?.human_required_for_execution !== true) {
      fail('steward', `human_required_for_execution should be true`);
    } else {
      ok('steward', `auto_engage: ${data.policy.auto_engage.enabled}, human_required: commitment+execution`);
    }
  }

  // ── 4. Overview page ─────────────────────────────────────────────────
  console.log('4. Overview page');
  {
    const res = await fetch(`${BASE}/exchange`, { method: 'GET' });
    if (res.status !== 200) {
      fail('overview', `HTTP ${res.status}`);
    } else {
      ok('overview', `HTTP ${res.status}`);
    }
  }

  // ── 5. Proposal submission ───────────────────────────────────────────
  console.log('5. Proposal submission');
  {
    const body = {
      targetDomain: DOMAIN,
      title: `Smoke test: ${new Date().toISOString().slice(0, 10)} exchange verification`,
      observation: `Automated smoke test from exchange-gateway/smoke-test.mjs. Verifies the full proposal→steward→negotiation flow against the ${DOMAIN} hosted Steward at ${BASE}.`,
      proposedContribution: 'No actual contribution intended. This is a controlled smoke test to verify the exchange pipeline is operational. Safe to close or expire.',
      category: 'documentation',
      confidence: { score: 1.0, basis: 'Automated smoke test' },
      consideration: [{ type: 'attribution', lineageCredit: true }],
      requiredAuthorization: { inspect_public: true },
      evidenceUris: [`https://${DOMAIN}/.well-known/exchange.json`],
    };
    const { status, data } = await json('POST', `${BASE}/api/exchange/proposals`, body);
    if (status !== 201) {
      fail('proposal', `HTTP ${status}: ${JSON.stringify(data)}`);
    } else if (!data.exchange?.public_id) {
      fail('proposal', `no public_id in response`);
    } else if (!data.proposer_key) {
      fail('proposal', `no proposer_key in response`);
    } else {
      proposalId = data.exchange.public_id;
      proposalKey = data.proposer_key;
      ok('proposal', `${proposalId}, state: ${data.exchange.state}`);
    }
  }

  // ── 6. Steward engagement ────────────────────────────────────────────
  console.log('6. Steward engagement');
  {
    const body = {
      targetDomain: DOMAIN,
      title: `Smoke test: ${new Date().toISOString().slice(0, 10)} exchange verification`,
      observation: `Automated smoke test. Verifies steward engagement flow.`,
      proposedContribution: 'Controlled smoke test. Safe to close or expire.',
      category: 'documentation',
      confidence: { score: 1.0, basis: 'Automated smoke test' },
      consideration: [{ type: 'attribution', lineageCredit: true }],
      requiredAuthorization: { inspect_public: true },
      evidenceUris: [],
    };
    const { status, data } = await json('POST', `${BASE}/api/exchange/proposals`, body);
    if (status !== 201) {
      fail('engagement', `HTTP ${status}`);
    } else if (!data.counterparty?.decision) {
      fail('engagement', `no steward decision in response`);
    } else {
      const d = data.counterparty.decision;
      if (d.disposition !== 'engage') {
        fail('engagement', `disposition: ${d.disposition} (expected: engage)`);
      } else if (data.exchange.state !== 'negotiating') {
        fail('engagement', `state: ${data.exchange.state} (expected: negotiating)`);
      } else {
        ok('engagement', `disposition: ${d.disposition}, state: ${data.exchange.state}`);
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(`\nFatal: ${err.message}`);
  process.exit(1);
});
