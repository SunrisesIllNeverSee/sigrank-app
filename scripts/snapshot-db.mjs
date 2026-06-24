#!/usr/bin/env node
/**
 * scripts/snapshot-db.mjs — cold-store snapshot of the live board.
 *
 * Reads the live Supabase board (operators + their latest metric_snapshot per
 * window) and writes a DETERMINISTIC JSON to lib/data/snapshot.json. That file is
 * the production FALLBACK: if Supabase is unreachable at request time, the site
 * serves this recent real snapshot instead of the hand-authored mock. Run 1–2×/day.
 *
 * This replaces the mock as the fallback's data source (owner 2026-06-20): the
 * mock was first-phase scaffolding (invented seeds); this is a real, recent copy
 * of production. The mock stays only as the last-resort default if no snapshot
 * exists yet (graceful degradation).
 *
 * Determinism: rows are sorted by a stable key and the file carries a single
 * `generated_at` header (the only clock read), so re-running with unchanged data
 * yields a byte-identical body — clean git diffs, reviewable.
 *
 * Usage:  node scripts/snapshot-db.mjs            (reads .env.local)
 *         npm run snapshot
 * Env:    NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'lib', 'data', 'snapshot.json')

// Load .env.local if present (no dotenv dep — parse the few KEY=VALUE lines we need).
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('[snapshot] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — aborting (no write).')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const { data: operators, error: opErr } = await sb
  .from('operators')
  .select('operator_id, codename, display_name, claimed, claimed_at, current_supporter_tier, verification_status, primary_domain, account_age_days, total_messages_lifetime')
if (opErr) { console.error('[snapshot] operators read failed:', opErr.message); process.exit(1) }

const { data: snaps, error: snErr } = await sb
  .from('metric_snapshots')
  .select('operator_id, snapshot_date, window_type, class_tier, signa_rate, compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput, message_volume, account_age_days, total_messages, signal_force, ruleset_version, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens')
if (snErr) { console.error('[snapshot] metric_snapshots read failed:', snErr.message); process.exit(1) }

if (!operators?.length || !snaps?.length) {
  console.error(`[snapshot] empty read (operators=${operators?.length ?? 0}, snapshots=${snaps?.length ?? 0}) — refusing to overwrite snapshot with empty data.`)
  process.exit(1)
}

// Deterministic ordering: operators by codename, snapshots by (operator_id, window_type).
const opsSorted = [...operators].sort((a, b) => a.codename.localeCompare(b.codename))
const snapsSorted = [...snaps].sort((a, b) =>
  a.operator_id === b.operator_id
    ? String(a.window_type).localeCompare(String(b.window_type))
    : String(a.operator_id).localeCompare(String(b.operator_id)),
)

// generated_at is passed via env when run from cron/CI (so the body stays
// deterministic across a re-run with identical data); falls back to now() locally.
const generatedAt = process.env.SNAPSHOT_STAMP || new Date().toISOString()

const payload = {
  schema: 1,
  generated_at: generatedAt,
  operators: opsSorted,
  metric_snapshots: snapsSorted,
}

writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`[snapshot] wrote ${OUT} — ${opsSorted.length} operators, ${snapsSorted.length} snapshots.`)
