/**
 * lib/data/mock.ts — fully deterministic mock dataset.
 *
 * This is the fallback dataset served whenever Supabase is not configured (no
 * creds present) so the app always builds and every page renders. Everything is
 * computed from fixed literals — NO random-number generation, NO wall-clock
 * reads at module scope. Re-importing this module always yields identical data.
 *
 * The one real operator is MO§ES (codename TransVaultOrigin); the other 11 are
 * fictional placeholders (claimed:false, isPlaceholder:true) spanning the class
 * and score range so every UI surface has populated, varied rows.
 */

import type { SignalClass } from '@/components/sigrank/types'
import { CLASS_NAME_TO_ID } from '@/lib/canon/ids'
import type { Operator, ScoredSnapshot, SupporterTier } from '@/lib/scoring/types'
import { computeCascadeMetrics } from '@/lib/ingest/bridge'

/** A leaderboard row: identity + scored snapshot + ranking metadata. */
export interface LeaderboardRow {
  operator: Operator
  snapshot: ScoredSnapshot
  global_rank: number
  /** Percentile [0,100], higher = better. */
  percentile: number
  /** Raw telemetry, present for the real operator and useful for mock detail. */
  telemetry: TelemetryRaw
  // ── 730 window layer (optional; mirrors metric_snapshots). These let the mock
  //    path filter by window identically to the live path (lib/data/windows.ts).
  //    Live rows populate them from the DB; mock rows set them below. ──
  /** DB window_type enum: '7d' | '30d' | '90d' | 'all_time'. */
  window_type?: string | null
  /** Snapshot DATE ('YYYY-MM-DD') — recency reference for the window buffer. */
  snapshot_date?: string | null
}

/** Shared snapshot date for the deterministic seed corpus (mirrors the live DB). */
const SEED_SNAPSHOT_DATE = '2026-05-14'

/**
 * The window_type a seed belongs to. The 8 owner seeds carry the window in their
 * codename ("static seed · 7d ✱mem" → 7d); everything else (MO§ES + the 10
 * tokscale lifetime seeds) stays '30d' — parity with the minimal live re-tag
 * (SCRATCHPAD TERM 730 flag #2). So 7d/90d/all show the owner ✱mem-vs-CLEAN moat
 * twins, and 30d stays the populated field.
 */
function seedWindowType(codename: string): string {
  if (codename.startsWith('static seed · 7d')) return '7d'
  if (codename.startsWith('static seed · 30d')) return '30d'
  if (codename.startsWith('static seed · 90d')) return '90d'
  if (codename.startsWith('static seed · all')) return 'all_time'
  return '30d'
}

/** Raw token telemetry (CANON §I / §VII). */
export interface TelemetryRaw {
  fresh_input: number
  output: number
  cache_read: number
  cache_create: number
  sessions: number
  turns: number
}

/** A single point in an operator's score history. */
export interface HistoryPoint {
  /** ISO date (deterministic literal — not derived from a clock). */
  date: string
  signa_rate: number
  global_rank: number
  class_tier: SignalClass
}

/** Aggregate homepage stat block. */
export interface HomepageStats {
  total_operators: number
  total_snapshots: number
  total_tokens_scored: number
  transmitter_count: number
  top_operator_codename: string
  top_signa_rate: number
  /** Whether these numbers are placeholders (mock fallback). */
  isPlaceholder: boolean
}

/** A Circle (team) summary row. */
export interface CircleRow {
  circle_id: string
  name: string
  tag: string
  member_count: number
  avg_signa_rate: number
  avg_compression: number
  global_rank: number
  owner_codename: string
  isPlaceholder: boolean
}

/** A Hall of Signal record. */
export interface HallRecord {
  /** Reward canonical id, e.g. "RW.28". */
  reward_id: string
  title: string
  operator_codename: string
  value: string
  date: string
  isPlaceholder: boolean
}

/** Per-class population row for the class distribution board. */
export interface ClassDistributionRow {
  class_tier: SignalClass
  class_id: string
  count: number
}

// ───────────────────────────────────────────────────────────────────────────
// MO§ES — the one real operator (CANON §VII). All values are verified literals.
// ───────────────────────────────────────────────────────────────────────────

const MOSES_OPERATOR: Operator = {
  operator_id: 'op-moses-0001',
  codename: 'TransVaultOrigin',
  display_name: 'TheSignalVault',
  claimed: true,
  claimed_at: '2026-05-14T00:00:00Z',
  claim_payment_id: 'pi_moses_claim_0001',
  claim_contact: null,
  current_supporter_tier: 'pro',
  verification_status: 'audited',
  primary_domain: 'claude',
  account_age_days: 119,
  total_messages_lifetime: 53960,
  isPlaceholder: false,
}

// MO§ES canonical pillars (verified against metrics.py SEED)
const MOSES_PILLARS = {
  input: 1_251_211,
  output: 11_296_121,
  cacheCreate: 128_196_310,
  cacheRead: 2_555_179_769,
}

const MOSES_SNAPSHOT: ScoredSnapshot = {
  signa_rate: 96.4,
  class_tier: 'TRANSMITTER',
  compression_ratio: 0.9694,
  prompt_complexity: { value: 92, confidence: 'low' },
  cross_thread: 37,
  session_depth: 26.1,
  token_throughput: 18450,
  signal_force: 12.8,
  drift_ratio: null,
  sdot_score: null,
  sdrm_score: null,
  movement_24h: 0,
  movement_7d: 0,
  ruleset_version: '1.0',
  cascade: computeCascadeMetrics(MOSES_PILLARS),
}

// Telemetry mirrors the canonical MOSES_PILLARS so TOTAL (Σ of the four) reads
// the canon 2.70B — matching RANK_ANALYSIS. (Previously held unrelated numbers
// that made the TOTAL column disagree with the cascade engine.)
const MOSES_TELEMETRY: TelemetryRaw = {
  fresh_input: MOSES_PILLARS.input,
  output: MOSES_PILLARS.output,
  cache_read: MOSES_PILLARS.cacheRead,
  cache_create: MOSES_PILLARS.cacheCreate,
  sessions: 21,
  turns: 7327,
}

const MOSES_ROW: LeaderboardRow = {
  operator: MOSES_OPERATOR,
  snapshot: MOSES_SNAPSHOT,
  global_rank: 1,
  percentile: 99.97,
  telemetry: MOSES_TELEMETRY,
  window_type: '30d',
  snapshot_date: SEED_SNAPSHOT_DATE,
}

// ───────────────────────────────────────────────────────────────────────────
// FROZEN SEED corpus — 10 real tokscale.ai operators (CANON_QUICKREF §2).
// Each carries its REAL four-integer SEED (input, output, cacheCreate, cacheRead);
// cascade/Υ is computed from those real pillars via computeCascadeMetrics() — the
// SAME path MO§ES uses — so the board reproduces the canon Υ values exactly.
// Display uses MYSTERY CODENAMES (real handles anonymized → no exact-number claim
// under a real person's handle). Non-cascade fields (signa/comp/class) remain
// reasonable placeholders until §ignarate has a real formula (task #3).
// Real handle ↔ codename mapping is kept internal (SEED_IDENTITY below).
// ───────────────────────────────────────────────────────────────────────────

interface SeedSpec {
  handle?: string // real tokscale/social @username (2nd line); seeds display real name + @handle
  codename: string
  realHandle: string // internal only — never displayed
  domain: string
  supporter: SupporterTier
  verification: Operator['verification_status']
  // the four frozen pillars (CANON_QUICKREF §2)
  input: number
  output: number
  cacheCreate: number
  cacheRead: number
  // display placeholders (until §ignarate lands)
  signa: number
  comp: number
  pc: number
  ct: number
  sd: number
  tt: number
  sf: number
  cls: SignalClass
  age: number
  lifetime: number
  sessions: number
  turns: number
}

// 10 frozen tokscale SEEDs. Pillars are LITERAL canon — do not edit.
// Pillars synced to RANK_ANALYSIS lifetime values (2026-06-18). These are the
// REAL tokscale lifetime four-integers (input, output, cacheCreate, cacheRead) —
// the engine derives every displayed metric from them. signa/comp/etc. remain
// placeholders until §ignarate is wired. cls reflects current ranking.
const SEED_CORPUS: SeedSpec[] = [
  // MO§ES via the tokscale reader — same operator as MOSES_ROW (ccusage), different
  // reader. Input puffed ~49× → Υ 16.24 (vs ccusage 18436.98), yet still #1 of the
  // field. Reader-robustness demonstration (CANON_QUICKREF §2). Owner: show both.
  { codename: 'TransVaultOrigin·tokscale', realHandle: 'MO§ES (tokscale reader)', domain: 'claude', supporter: 'pro', verification: 'audited',
    input: 61_349_259, output: 17_117_729, cacheCreate: 161_665_905, cacheRead: 3_570_556_236,
    signa: 96.4, comp: 0.218, pc: 92, ct: 37, sd: 26.1, tt: 18450, sf: 12.8, cls: 'TRANSMITTER', age: 119, lifetime: 25234, sessions: 30, turns: 7327 },
  // APP SEED (owner 2026-06-24) — the owner's all-time numbers as the Claude Code DESKTOP APP
  // reports them: app raw in/out (6.4M / 38.7M, no dedup) + tokenpull all-time cache pillars
  // (the app surfaces no cache). A reader-convention data point: app counts output raw (~2.7×
  // tokenpull's deduped 14.5M) and trims input, so Υ ≈ 3539 vs tokenpull's 745 — same operator,
  // app accounting. Demonstrates how the token-count convention moves the signature.
  { codename: 'app seed', realHandle: 'OWNER all-time (Claude desktop-app in/out + tokenpull cache)', domain: 'claude', supporter: 'pro', verification: 'audited',
    input: 6_400_000, output: 38_700_000, cacheCreate: 151_089_792, cacheRead: 3_746_087_427,
    signa: 99.0, comp: 0.858, pc: 95, ct: 40, sd: 28.0, tt: 19069, sf: 14.0, cls: 'TRANSMITTER', age: 119, lifetime: 38700, sessions: 935, turns: 19069 },
  { codename: 'OrcaVanguard', realHandle: "Ólafur Nils Sigurðsson", handle: "olafurns7", domain: 'claude', supporter: 'pro', verification: 'verified',
    input: 20_500_000_000, output: 1_900_000_000, cacheCreate: 1_400_000_000, cacheRead: 572_400_000_000,
    signa: 88.0, comp: 0.880, pc: 84, ct: 36, sd: 23.0, tt: 16000, sf: 11.4, cls: 'TRANSMITTER', age: 110, lifetime: 38000, sessions: 17, turns: 5900 },
  { codename: 'IronLattice', realHandle: "Ivan Golovach", handle: "IvGolovach", domain: 'claude', supporter: 'patron', verification: 'verified',
    input: 17_000_000_000, output: 1_300_000_000, cacheCreate: 352_600, cacheRead: 512_000_000_000,
    signa: 84.0, comp: 0.840, pc: 80, ct: 33, sd: 21.6, tt: 14800, sf: 10.6, cls: 'TRANSMITTER', age: 96, lifetime: 33000, sessions: 15, turns: 5100 },
  { codename: 'PrismCartographer', realHandle: "Feng GAO", handle: "gaofeng21cn", domain: 'gemini', supporter: 'free', verification: 'unverified',
    input: 26_900_000_000, output: 2_000_000_000, cacheCreate: 238_300, cacheRead: 475_400_000_000,
    signa: 79.3, comp: 0.792, pc: 73, ct: 28, sd: 19.2, tt: 12400, sf: 9.4, cls: 'ARCH+', age: 64, lifetime: 27600, sessions: 14, turns: 4180 },
  { codename: 'MeridianScribe', realHandle: "Max Ghenis", handle: "MaxGhenis", domain: 'claude', supporter: 'patron', verification: 'verified',
    input: 16_200_000_000, output: 1_100_000_000, cacheCreate: 1_100_000_000, cacheRead: 361_400_000_000,
    signa: 76.1, comp: 0.764, pc: 70, ct: 26, sd: 17.8, tt: 11200, sf: 8.8, cls: 'ARCH+', age: 58, lifetime: 22100, sessions: 13, turns: 3720 },
  { codename: 'VectorHerald', realHandle: "Sylvain Tissier", handle: "SylTi", domain: 'multi', supporter: 'circle_sponsor', verification: 'audited',
    input: 8_300_000_000, output: 495_200_000, cacheCreate: 111_400_000, cacheRead: 210_600_000_000,
    signa: 71.0, comp: 0.701, pc: 66, ct: 24, sd: 16.0, tt: 10100, sf: 8.1, cls: 'ARCH', age: 52, lifetime: 19400, sessions: 11, turns: 3080 },
  { codename: 'EmberCoil', realHandle: "Maple Gao", handle: "MapleEve", domain: 'pi', supporter: 'free', verification: 'unverified',
    input: 36_900_000_000, output: 3_000_000_000, cacheCreate: 1_000_000_000, cacheRead: 824_400_000_000,
    signa: 57.8, comp: 0.561, pc: 53, ct: 18, sd: 12.0, tt: 7400, sf: 6.2, cls: 'POWER', age: 39, lifetime: 11200, sessions: 8, turns: 1880 },
  { codename: 'DriftPilgrim', realHandle: "Vincent Koc", handle: "vincentkoc", domain: 'gemini', supporter: 'patron', verification: 'verified',
    input: 7_400_000_000, output: 415_100_000, cacheCreate: 223_700_000, cacheRead: 233_400_000_000,
    signa: 47.2, comp: 0.452, pc: 44, ct: 14, sd: 9.6, tt: 5800, sf: 5.1, cls: 'BASE', age: 34, lifetime: 8600, sessions: 6, turns: 1240 },
  { codename: 'SignalFledgling', realHandle: "ben", handle: "cexll", domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 67_700_000_000, output: 64_000_000_000, cacheCreate: 168_800_000, cacheRead: 36_800_000_000,
    signa: 36.5, comp: 0.354, pc: 33, ct: 10, sd: 7.2, tt: 4100, sf: 3.9, cls: 'SEEKER', age: 21, lifetime: 4900, sessions: 5, turns: 760 },
  { codename: 'QuietHollow', realHandle: "steve wu", handle: "wuwangzhang1216", domain: 'pi', supporter: 'free', verification: 'unverified',
    input: 164_100_000_000, output: 26_000_000_000, cacheCreate: 170_100_000, cacheRead: 296_800_000_000,
    signa: 24.0, comp: 0.224, pc: 21, ct: 6, sd: 5.4, tt: 2600, sf: 2.6, cls: 'REFINER', age: 16, lifetime: 2300, sessions: 4, turns: 420 },
  { codename: 'AshIgnition', realHandle: "Nepomuk Crhonek", handle: "Nepomuk5665", domain: 'chatgpt', supporter: 'free', verification: 'unverified',
    input: 4_036_000_000_000, output: 1_258_000_000_000, cacheCreate: 99_000_000_000, cacheRead: 1_661_000_000_000,
    signa: 11.8, comp: 0.118, pc: 12, ct: 3, sd: 2.8, tt: 1200, sf: 1.4, cls: 'IGNITER', age: 9, lifetime: 740, sessions: 2, turns: 140 },

  // ─────────────────────────────────────────────────────────────────────────
  // OWNER's own 730 pulls, staged as static seeds (SEED_CANDIDATES.md, 2026-06-19).
  // 8 rows = 7d/30d/90d/all-time × WITH-mem (observer-inflated) / CLEAN (honest).
  // Owner decision: show BOTH variants so the board PUBLICLY demonstrates the
  // observer-contamination gap — honesty as a feature (the moat). Window is baked
  // into the codename ("static seed · 7d ✱mem") until the 730 window filter lands;
  // they render identically to every other seed (no component change). Υ is real
  // engine output from the four pillars. comp = real SNR per the canon engine.
  // realHandle marks the variant internally; ✱ = observer-inflated.
  { codename: 'static seed · 7d ✱mem', realHandle: 'OWNER 7d (WITH claude-mem — inflated)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 3_404_076, output: 5_561_147, cacheCreate: 67_871_602, cacheRead: 1_163_017_207,
    signa: 56.0, comp: 0.620, pc: 60, ct: 20, sd: 14.0, tt: 8200, sf: 6.8, cls: 'ARCH+', age: 30, lifetime: 5561, sessions: 280, turns: 5100 },
  { codename: 'static seed · 30d ✱mem', realHandle: 'OWNER 30d (WITH claude-mem — inflated)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_657_915, output: 12_839_513, cacheCreate: 152_629_397, cacheRead: 2_575_983_107,
    signa: 73.0, comp: 0.734, pc: 70, ct: 26, sd: 18.0, tt: 12400, sf: 9.0, cls: 'TRANSMITTER', age: 30, lifetime: 12840, sessions: 640, turns: 12200 },
  { codename: 'static seed · 90d ✱mem', realHandle: 'OWNER 90d (WITH claude-mem — inflated)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_709_166, output: 15_598_921, cacheCreate: 176_566_528, cacheRead: 3_282_304_883,
    signa: 80.0, comp: 0.768, pc: 74, ct: 29, sd: 20.0, tt: 14600, sf: 10.2, cls: 'TRANSMITTER', age: 90, lifetime: 15599, sessions: 780, turns: 15000 },
  { codename: 'static seed · all ✱mem', realHandle: 'OWNER all-time (WITH claude-mem — inflated)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_709_166, output: 15_598_921, cacheCreate: 176_566_528, cacheRead: 3_282_304_883,
    signa: 80.0, comp: 0.768, pc: 74, ct: 29, sd: 20.0, tt: 14600, sf: 10.2, cls: 'TRANSMITTER', age: 119, lifetime: 15599, sessions: 935, turns: 19069 },
  { codename: 'static seed · 7d', realHandle: 'OWNER 7d (CLEAN — observer stripped)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 3_378_021, output: 4_019_626, cacheCreate: 49_108_106, cacheRead: 1_034_353_553,
    signa: 50.0, comp: 0.543, pc: 55, ct: 18, sd: 12.5, tt: 7100, sf: 6.0, cls: 'ARCH+', age: 30, lifetime: 4020, sessions: 270, turns: 4900 },
  { codename: 'static seed · 30d', realHandle: 'OWNER 30d (CLEAN — observer stripped)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_601_100, output: 9_375_735, cacheCreate: 109_089_285, cacheRead: 2_317_643_032,
    signa: 67.0, comp: 0.671, pc: 66, ct: 24, sd: 16.5, tt: 10800, sf: 8.4, cls: 'TRANSMITTER', age: 30, lifetime: 9376, sessions: 600, turns: 11000 },
  { codename: 'static seed · 90d', realHandle: 'OWNER 90d (CLEAN — observer stripped)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_652_351, output: 12_135_143, cacheCreate: 133_026_416, cacheRead: 3_023_964_808,
    signa: 75.0, comp: 0.722, pc: 71, ct: 27, sd: 18.5, tt: 13200, sf: 9.6, cls: 'TRANSMITTER', age: 90, lifetime: 12135, sessions: 730, turns: 14000 },
  { codename: 'static seed · all', realHandle: 'OWNER all-time (CLEAN — observer stripped)', domain: 'claude', supporter: 'free', verification: 'unverified',
    input: 4_652_351, output: 12_135_143, cacheCreate: 133_026_416, cacheRead: 3_023_964_808,
    signa: 75.0, comp: 0.722, pc: 71, ct: 27, sd: 18.5, tt: 13200, sf: 9.6, cls: 'TRANSMITTER', age: 119, lifetime: 12135, sessions: 935, turns: 19069 },
]

/** Internal-only map: codename → real tokscale handle. NEVER rendered publicly. */
export const SEED_IDENTITY: Record<string, string> = Object.fromEntries(
  SEED_CORPUS.map((s) => [s.codename, s.realHandle]),
)

// The 10 real-people seeds (public tokscale operators) display under their REAL
// name, not the codename. MO§ES (·tokscale) and the OWNER "static seed ·" rows keep
// their codename. operator_id stays derived from the ORIGINAL codename so URLs +
// SEED_IDENTITY keys stay stable even though the displayed name is the real handle.
function seedDisplaysRealName(spec: SeedSpec): boolean {
  return (
    !spec.codename.includes('·tokscale') &&
    !spec.codename.startsWith('static seed ·') &&
    spec.codename !== 'app seed'
  )
}

function seedToRow(spec: SeedSpec): LeaderboardRow {
  const displaysReal = seedDisplaysRealName(spec)
  const displayName = displaysReal ? spec.realHandle : spec.codename
  const operator: Operator = {
    operator_id: `op-${spec.codename.toLowerCase()}`,
    codename: displayName,
    display_name: null,
    // 2nd-line @handle for the 10 real-people seeds (real tokscale username).
    handle: displaysReal ? (spec.handle ?? null) : null,
    claimed: false,
    claimed_at: null,
    claim_payment_id: null,
    claim_contact: null,
    current_supporter_tier: spec.supporter,
    verification_status: spec.verification,
    primary_domain: spec.domain,
    account_age_days: spec.age,
    total_messages_lifetime: spec.lifetime,
    isPlaceholder: true,
  }
  // Cascade computed from the REAL frozen pillars — reproduces canon Υ.
  const pillars = {
    input: spec.input,
    output: spec.output,
    cacheCreate: spec.cacheCreate,
    cacheRead: spec.cacheRead,
  }
  const snapshot: ScoredSnapshot = {
    signa_rate: spec.signa,
    class_tier: spec.cls,
    compression_ratio: spec.comp,
    prompt_complexity: { value: spec.pc, confidence: 'low' },
    cross_thread: spec.ct,
    session_depth: spec.sd,
    token_throughput: spec.tt,
    signal_force: spec.sf,
    drift_ratio: null,
    sdot_score: null,
    sdrm_score: null,
    movement_24h: 0,
    movement_7d: 0,
    ruleset_version: '1.0',
    cascade: computeCascadeMetrics(pillars),
  }
  return {
    operator,
    snapshot,
    global_rank: 0, // assigned after Υ sort below
    percentile: 0,
    telemetry: {
      fresh_input: spec.input,
      output: spec.output,
      cache_read: spec.cacheRead,
      cache_create: spec.cacheCreate,
      sessions: spec.sessions,
      turns: spec.turns,
    },
    window_type: seedWindowType(spec.codename),
    snapshot_date: SEED_SNAPSHOT_DATE,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Exported collections.
// ───────────────────────────────────────────────────────────────────────────

/**
 * The full leaderboard: MO§ES + the 10 frozen tokscale SEEDs, ranked by real Υ.
 * Every row's cascade/Υ is real engine output (CANON_QUICKREF §2). Ranks +
 * percentiles are assigned by descending Υ so the board reflects true yield.
 */
export const MOCK_LEADERBOARD: LeaderboardRow[] = (() => {
  const rows = [MOSES_ROW, ...SEED_CORPUS.map(seedToRow)]
  rows.sort((a, b) => (b.snapshot.cascade?.yield_ ?? 0) - (a.snapshot.cascade?.yield_ ?? 0))
  const n = rows.length
  rows.forEach((r, i) => {
    r.global_rank = i + 1
    r.percentile = Math.round(((n - i) / n) * 1000) / 10
  })
  return rows
})()

/** All operators (identity records) in rank order. */
export const MOCK_OPERATORS: Operator[] = MOCK_LEADERBOARD.map((r) => r.operator)

/** Per-operator score history keyed by codename (deterministic literal points). */
export const MOCK_HISTORY: Record<string, HistoryPoint[]> = {
  TransVaultOrigin: [
    { date: '2026-04-21', signa_rate: 92.1, global_rank: 1, class_tier: 'TRANSMITTER' },
    { date: '2026-04-28', signa_rate: 93.8, global_rank: 1, class_tier: 'TRANSMITTER' },
    { date: '2026-05-05', signa_rate: 95.0, global_rank: 1, class_tier: 'TRANSMITTER' },
    { date: '2026-05-12', signa_rate: 95.9, global_rank: 1, class_tier: 'TRANSMITTER' },
    { date: '2026-05-19', signa_rate: 96.4, global_rank: 1, class_tier: 'TRANSMITTER' },
  ],
  OrcaVanguard: [
    { date: '2026-04-21', signa_rate: 87.0, global_rank: 3, class_tier: 'TRANSMITTER' },
    { date: '2026-04-28', signa_rate: 88.4, global_rank: 2, class_tier: 'TRANSMITTER' },
    { date: '2026-05-05', signa_rate: 89.9, global_rank: 2, class_tier: 'TRANSMITTER' },
    { date: '2026-05-12', signa_rate: 90.6, global_rank: 2, class_tier: 'TRANSMITTER' },
    { date: '2026-05-19', signa_rate: 91.2, global_rank: 2, class_tier: 'TRANSMITTER' },
  ],
}

/** One hour of the operators-online daily curve (BlitzStars "Hourly"). */
export interface HourlyPoint {
  /** Hour label, "00".."23". */
  label: string
  online: number
}

/** One day of the weekly online band — daily max and average (BlitzStars "Weekly"). */
export interface WeeklyPoint {
  label: string
  max: number
  avg: number
}

/**
 * Live operators online for one country (BlitzStars "Players Online - Live").
 * Country-level, not continent — operators self-identify by country.
 */
export interface CountryCount {
  country: string
  online: number
}

/** MOCK_HOURLY — deterministic 24h operators-online curve (evening peak ~19:00). */
export const MOCK_HOURLY: HourlyPoint[] = [
  { label: '00', online: 980 },
  { label: '01', online: 870 },
  { label: '02', online: 760 },
  { label: '03', online: 690 },
  { label: '04', online: 660 },
  { label: '05', online: 700 },
  { label: '06', online: 820 },
  { label: '07', online: 1010 },
  { label: '08', online: 1180 },
  { label: '09', online: 1290 },
  { label: '10', online: 1360 },
  { label: '11', online: 1410 },
  { label: '12', online: 1450 },
  { label: '13', online: 1480 },
  { label: '14', online: 1520 },
  { label: '15', online: 1590 },
  { label: '16', online: 1660 },
  { label: '17', online: 1740 },
  { label: '18', online: 1820 },
  { label: '19', online: 1900 },
  { label: '20', online: 1880 },
  { label: '21', online: 1790 },
  { label: '22', online: 1560 },
  { label: '23', online: 1240 },
]

/** MOCK_WEEKLY — 7-day online band: daily maximum + daily average. */
export const MOCK_WEEKLY: WeeklyPoint[] = [
  { label: 'Mon', max: 1820, avg: 1240 },
  { label: 'Tue', max: 1760, avg: 1180 },
  { label: 'Wed', max: 1890, avg: 1310 },
  { label: 'Thu', max: 1940, avg: 1360 },
  { label: 'Fri', max: 2010, avg: 1420 },
  { label: 'Sat', max: 1980, avg: 1400 },
  { label: 'Sun', max: 1847, avg: 1330 },
]

/** MOCK_COUNTRIES — live operators online by country (country-level, not continent). */
export const MOCK_COUNTRIES: CountryCount[] = [
  { country: 'United States', online: 642 },
  { country: 'Germany', online: 318 },
  { country: 'Japan', online: 274 },
  { country: 'United Kingdom', online: 201 },
  { country: 'Canada', online: 168 },
  { country: 'France', online: 142 },
  { country: 'Brazil', online: 121 },
  { country: 'Australia', online: 98 },
  { country: 'India', online: 83 },
]

/** Homepage aggregate stats (placeholder block). */
export const MOCK_HOMEPAGE_STATS: HomepageStats = {
  total_operators: MOCK_OPERATORS.length,
  total_snapshots: 1240,
  total_tokens_scored: 1123252011,
  transmitter_count: MOCK_LEADERBOARD.filter((r) => r.snapshot.class_tier === 'TRANSMITTER').length,
  top_operator_codename: 'TransVaultOrigin',
  top_signa_rate: 96.4,
  isPlaceholder: true,
}

/** Hall of Signal records (placeholder; MO§ES holds the compression record). */
export const MOCK_HALL: HallRecord[] = [
  { reward_id: 'RW.28', title: 'Highest Compression Ever', operator_codename: 'TransVaultOrigin', value: '0.9694', date: '2026-05-14', isPlaceholder: true },
  { reward_id: 'RW.29', title: 'Deepest Single Session', operator_codename: 'TransVaultOrigin', value: '348.9 turns/session', date: '2026-05-14', isPlaceholder: true },
  { reward_id: 'RW.30', title: 'Most Cross-Thread Continuity', operator_codename: 'OrcaVanguard', value: '41', date: '2026-05-12', isPlaceholder: true },
  { reward_id: 'RW.31', title: 'Longest Transmitter Streak', operator_codename: 'TransVaultOrigin', value: '35 days', date: '2026-05-19', isPlaceholder: true },
  { reward_id: 'RW.32', title: 'Largest 24h Rank Climb', operator_codename: 'SignalFledgling', value: '+5', date: '2026-05-18', isPlaceholder: true },
  { reward_id: 'RW.33', title: 'First Verified Transmitter', operator_codename: 'TransVaultOrigin', value: 'claude region', date: '2026-05-14', isPlaceholder: true },
]

/** Circles (placeholder; Phase 2 feature). */
export const MOCK_CIRCLES: CircleRow[] = [
  { circle_id: 'circle-signalvault', name: 'The Signal Vault', tag: 'VAULT', member_count: 7, avg_signa_rate: 88.3, avg_compression: 0.901, global_rank: 1, owner_codename: 'TransVaultOrigin', isPlaceholder: true },
  { circle_id: 'circle-axiom', name: 'Axiom Collective', tag: 'AXIM', member_count: 5, avg_signa_rate: 79.1, avg_compression: 0.812, global_rank: 2, owner_codename: 'OrcaVanguard', isPlaceholder: true },
  { circle_id: 'circle-prism', name: 'Prism Cartographers', tag: 'PRSM', member_count: 6, avg_signa_rate: 68.4, avg_compression: 0.724, global_rank: 3, owner_codename: 'PrismCartographer', isPlaceholder: true },
]

/** Class distribution across the mock population. */
export const MOCK_CLASS_DISTRIBUTION: ClassDistributionRow[] = (() => {
  const counts = new Map<SignalClass, number>()
  for (const row of MOCK_LEADERBOARD) {
    counts.set(row.snapshot.class_tier, (counts.get(row.snapshot.class_tier) ?? 0) + 1)
  }
  const order: SignalClass[] = [
    'TRANSMITTER', 'ARCH+', 'ARCH', 'POWER', 'BASE', 'SEEKER', 'REFINER', 'BEARER', 'IGNITER',
  ]
  return order.map((cls) => ({
    class_tier: cls,
    class_id: CLASS_NAME_TO_ID[cls],
    count: counts.get(cls) ?? 0,
  }))
})()
