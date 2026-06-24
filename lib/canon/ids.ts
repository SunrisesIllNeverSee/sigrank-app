/**
 * lib/canon/ids.ts — Canonical ID registry.
 *
 * Single source of truth for every canonical-id (CanonId) used anywhere in the
 * SigRank web app. Mirrors `1_sigrank/1.1_layer-0-ground/build/CANON.md`. Every
 * value rendered as a "real" number gets a <CanonId/> superscript that traces
 * back to one of these IDs.
 *
 * This module is dependency-free and safe to import from both server and client.
 *
 * ┌─ OPERATING MODE: TOKEN-BASED (current) ──────────────────────────────────┐
 * │ SigRank ranks on the TOKEN CASCADE — Υ Yield / SNR / Leverage / Velocity  │
 * │ / 10xDEV / Total / $-per-1M — derived from the four raw token pillars in  │
 * │ `lib/ingest/bridge.ts` (computeCascadeMetrics) — registered below as the  │
 * │ TOKEN_METRICS block (Y.01–Y.08): the live, token-based ranking canon.      │
 * │                                                                           │
 * │ The metrics below (Core 5 / composites / extras) are the WORD-ERA canon,  │
 * │ RETAINED as background for the planned evolution to word-based ranking.   │
 * │ Each entry carries `era`: 'token' = live/surfaceable · 'word' = background │
 * │ (do NOT surface on launch pages until the word-based layer ships).        │
 * │ SIGNA RATE (C.01) is KEPT and currently CALIBRATING (era 'token').        │
 * │ See Devins_Plans/TAXONOMY.md (PART C) for the full token↔word split.      │
 * └───────────────────────────────────────────────────────────────────────────┘
 */

import type { SignalClass } from '@/components/sigrank/types'
import { colors } from '@/components/sigrank/tokens'

/** Functional grouping of a metric within the 11-core stack (or extras). */
export type MetricGroup = 'core5' | 'background3' | 'composite' | 'extra'

export interface MetricDef {
  /** Canonical ID, e.g. "M.01". */
  id: string
  /** Short display ticker, e.g. "COMP". */
  ticker: string
  /** Human-readable metric name. */
  name: string
  /** Functional group within the stack. */
  group: MetricGroup
  /** Column in `metric_snapshots` this metric reads from. */
  dbColumn: string
  /**
   * Scoring era this metric belongs to (see the OPERATING MODE banner above):
   *  - 'token' — live / surfaceable now (the token-based system, incl. calibrating SIGNA).
   *  - 'word'  — WORD-ERA background; retained for the future word-based ranking.
   *              Do NOT surface 'word' metrics on launch pages until that layer ships.
   */
  era: 'token' | 'word'
}

/**
 * A token-cascade metric (Y.xx) — DERIVED on read from the raw token pillars
 * (T.xx telemetry) by computeCascadeMetrics() in lib/ingest/bridge.ts. These are
 * the LIVE, token-based ranking metrics (era always 'token').
 */
export interface TokenMetricDef {
  /** Canonical ID, e.g. "Y.01". */
  id: string
  /** Short display ticker, e.g. "LEV". */
  ticker: string
  /** Human-readable name. */
  name: string
  /** Plain-language formula over the raw telemetry pillars (T.xx). */
  formula: string
  /** Always 'token' — these are the current live ranking metrics. */
  era: 'token'
}

/**
 * TOKEN_METRICS — the LIVE token cascade (Y.01..Y.08). Derived from the four raw
 * token pillars (T.01 output · T.02 fresh_input · T.03 cache_read · T.04
 * cache_create) by computeCascadeMetrics() (lib/ingest/bridge.ts). THIS is what
 * the board ranks on. Raw totals stay under telemetry T.xx (Total = T.05). The
 * WORD-ERA Core-5 / composites / extras live in METRICS below (retained background).
 *
 * NEW canon namespace 'Y.' (minted 2026-06-20; the cascade had no IDs — CANON.md is
 * word-era and predates it). TODO(CANON.SYNC): mirror this Y.xx block into
 * 1_sigrank/1.1_layer-0-ground/build/CANON.md once the owner ratifies the namespace.
 */
export const TOKEN_METRICS: Record<string, TokenMetricDef> = {
  'Y.01': { id: 'Y.01', ticker: 'Υ', name: 'Υ Yield', formula: '(T.03 / T.02) × (T.01 / T.02) — leverage × velocity (headline)', era: 'token' },
  'Y.02': { id: 'Y.02', ticker: 'SNR', name: 'SNR', formula: 'T.01 / (T.01 + T.02) — output share of fresh traffic', era: 'token' },
  'Y.03': { id: 'Y.03', ticker: 'LEV', name: 'Leverage', formula: 'T.03 / T.02 — cache reuse per fresh input', era: 'token' },
  'Y.04': { id: 'Y.04', ticker: 'VEL', name: 'Velocity', formula: 'T.01 / T.02 — output per fresh input', era: 'token' },
  'Y.05': { id: 'Y.05', ticker: '10xDEV', name: '10xDEV', formula: 'log10(transmission × commitment × reuse); null if any factor is 0', era: 'token' },
  'Y.06': { id: 'Y.06', ticker: 'SCALE', name: 'Scale V', formula: 'log10(T.05 total tokens) — raw operator scale', era: 'token' },
  'Y.07': { id: 'Y.07', ticker: '$/1M', name: 'Cost per 1M', formula: 'blended USD per 1,000,000 tokens — efficiency at the wallet', era: 'token' },
  'Y.08': { id: 'Y.08', ticker: 'EFF', name: 'Efficiency', formula: '((T.03 + T.04 + T.01) / T.02) / 4.0 — vs the AA baseline', era: 'token' },
  'Y.09': { id: 'Y.09', ticker: 'OP', name: 'Op Ratio', formula: 'leverage:1:velocity — cache-read per input : 1 : output per input (composition shorthand)', era: 'token' },
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CANONICAL DISPLAY SET (owner 2026-06-22) — the metrics shown on EVERY surface
 * (metric cards · leaderboard · wiki · landing · hall), in this exact order, two
 * groups: RAW (the pillars) then METRICS (the cascade). One source of truth so the
 * surfaces can't drift. `key` is the accessor on LeaderboardEntry (components/sigrank
 * types) / row.snapshot.cascade. Nothing here is removed; $/1M intentionally appears
 * in BOTH the RAW group (the wallet pillar) and METRICS (the cost metric) per owner.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface DisplayMetric {
  /** Canonical id (T.xx raw pillar, or Y.xx cascade metric). */
  id: string
  /** Short ticker / glyph-free label. */
  ticker: string
  /** Human-readable name. */
  name: string
  /** Accessor key on LeaderboardEntry (and the cascade object). */
  key: string
  /** true when smaller is better (cost). */
  lowerIsBetter?: boolean
}

/** RAW pillars (6) — input · output · cache-read · cache-write · total · cost. */
export const DISPLAY_RAW: DisplayMetric[] = [
  { id: 'T.02', ticker: 'IN', name: 'Input', key: 'input' },
  { id: 'T.01', ticker: 'OUT', name: 'Output', key: 'output' },
  { id: 'T.03', ticker: 'CR', name: 'Cache-read', key: 'cacheRead' },
  { id: 'T.04', ticker: 'CW', name: 'Cache-write', key: 'cacheWrite' },
  { id: 'T.05', ticker: '∑', name: 'Total', key: 'totalTokens' },
  { id: 'Y.07', ticker: '$/1M', name: 'Cost', key: 'costPerMillion', lowerIsBetter: true },
]

/** METRICS (9) — the full token cascade (Y.01–Y.08) + Op Ratio (Y.09). */
export const DISPLAY_METRICS: DisplayMetric[] = [
  { id: 'Y.01', ticker: 'Υ', name: 'Υ Yield', key: 'yield_' },
  { id: 'Y.02', ticker: 'SNR', name: 'SNR', key: 'snr' },
  { id: 'Y.03', ticker: 'LEV', name: 'Leverage', key: 'leverage' },
  { id: 'Y.04', ticker: 'VEL', name: 'Velocity', key: 'velocity' },
  { id: 'Y.05', ticker: '10xDEV', name: '10xDEV', key: 'dev10x' },
  { id: 'Y.06', ticker: 'SCALE', name: 'Scale V', key: 'scaleV' },
  { id: 'Y.07', ticker: '$/1M', name: 'Cost per 1M', key: 'costPerMillion', lowerIsBetter: true },
  { id: 'Y.08', ticker: 'EFF', name: 'Efficiency', key: 'efficiency' },
  { id: 'Y.09', ticker: 'OP', name: 'Op Ratio', key: 'opRatio' },
]

/**
 * METRICS — the WORD-ERA tracked metrics keyed by canonical id (retained background;
 * the live system is TOKEN_METRICS / Y.xx above). Core 5 (M.01–M.05) + Background 3
 * (B.01–B.03) + Big 3 composites (C.01–C.03) + 2 extras (E.01, E.02).
 */
export const METRICS: Record<string, MetricDef> = {
  // ── Core 5 — WORD-ERA · background (retained; NOT surfaced on the live token board) ──
  'M.01': {
    id: 'M.01',
    ticker: 'COMP',
    name: 'Compression Ratio',
    group: 'core5',
    dbColumn: 'compression_ratio',
    era: 'word',
  },
  'M.02': {
    id: 'M.02',
    ticker: 'PC',
    name: 'Prompt Complexity',
    group: 'core5',
    dbColumn: 'prompt_complexity',
    era: 'word',
  },
  'M.03': {
    id: 'M.03',
    ticker: 'CT',
    name: 'Cross-Thread Referencing',
    group: 'core5',
    dbColumn: 'cross_thread',
    era: 'word',
  },
  'M.04': {
    id: 'M.04',
    ticker: 'SD',
    name: 'Session Depth',
    group: 'core5',
    dbColumn: 'session_depth',
    era: 'word',
  },
  'M.05': {
    id: 'M.05',
    ticker: 'TT',
    name: 'Token Throughput',
    group: 'core5',
    dbColumn: 'token_throughput',
    era: 'word',
  },

  // ── Background 3 — token-era relabeled (surfaceable) ──────────────────────
  'B.01': {
    id: 'B.01',
    ticker: 'TV',
    name: 'Turn Volume',
    group: 'background3',
    dbColumn: 'message_volume', // DB column unchanged; label is token-era (a turn = one exchange)
    era: 'token',
  },
  'B.02': {
    id: 'B.02',
    ticker: 'AGE',
    name: 'Account Age',
    group: 'background3',
    dbColumn: 'account_age_days',
    era: 'token',
  },
  'B.03': {
    id: 'B.03',
    ticker: 'TRN',
    name: 'Total Turns',
    group: 'background3',
    dbColumn: 'total_messages', // DB column unchanged; label is token-era
    era: 'token',
  },

  // ── Composites (Big 3) — C.01 SIGNA kept (calibrating); SDOT/SDRM word-era deferred ──
  'C.01': {
    id: 'C.01',
    ticker: 'SIGNA',
    name: 'SIGNA RATE',
    group: 'composite',
    dbColumn: 'signa_rate',
    era: 'token', // KEPT — currently calibrating; stays on the board
  },
  'C.02': {
    id: 'C.02',
    ticker: 'SDOT',
    name: 'Signal Delta Over Time',
    group: 'composite',
    dbColumn: 'sdot_score',
    era: 'word',
  },
  'C.03': {
    id: 'C.03',
    ticker: 'SDRM',
    name: 'Signal Density Resonance Metric',
    group: 'composite',
    dbColumn: 'sdrm_score',
    era: 'word',
  },

  // ── Extras (outside the 11-core) — WORD-ERA · pro/deferred ────────────────
  'E.01': {
    id: 'E.01',
    ticker: 'SF',
    name: 'Signal Force',
    group: 'extra',
    dbColumn: 'signal_force',
    era: 'word',
  },
  'E.02': {
    id: 'E.02',
    ticker: 'DR%',
    name: 'Drift Ratio',
    group: 'extra',
    dbColumn: 'drift_ratio',
    era: 'word',
  },
}

export interface ClassTierDef {
  /** Canonical ID, e.g. "K.01". */
  id: string
  /** Public class name as used by SignalClass. */
  name: SignalClass
  /** Public glyph. */
  glyph: string
  /** Hex color (pulled from the shared design tokens). */
  hex: string
  /** Compression floor (qualitative public cut). */
  compMin: number
  /** SIGNA RATE floor — null for classes that have no SIGNA gate. */
  signaMin: number | null
  /** One-line public meaning. */
  meaning: string
}

/**
 * CLASS_TIERS — the 9-class hierarchy K.01..K.09.
 * Qualitative cuts are public (CANON §V); exact numeric breakpoints live
 * server-side as RS.05 in lib/scoring/ruleset.ts.
 */
export const CLASS_TIERS: Record<string, ClassTierDef> = {
  'K.01': {
    id: 'K.01',
    name: 'TRANSMITTER',
    glyph: '◈',
    hex: colors.class.TRANSMITTER,
    compMin: 0.85,
    signaMin: 85,
    meaning: "You don't just use the system. You are the system.",
  },
  'K.02': {
    id: 'K.02',
    name: 'ARCH+',
    glyph: '▲',
    hex: colors.class['ARCH+'],
    compMin: 0.75,
    signaMin: 75,
    meaning: 'Precision creators. Structure from signal.',
  },
  'K.03': {
    id: 'K.03',
    name: 'ARCH',
    glyph: '▽',
    hex: colors.class.ARCH,
    compMin: 0.65,
    signaMin: 65,
    meaning: 'System builders. Coherent operators.',
  },
  'K.04': {
    id: 'K.04',
    name: 'POWER',
    glyph: '⬡',
    hex: colors.class.POWER,
    compMin: 0.5,
    signaMin: 50,
    meaning: 'Forming forge. Active but noisy.',
  },
  'K.05': {
    id: 'K.05',
    name: 'BASE',
    glyph: '↓',
    hex: colors.class.BASE,
    compMin: 0.4,
    signaMin: null,
    meaning: 'Signal breaking through. Clarity is emerging.',
  },
  'K.06': {
    id: 'K.06',
    name: 'SEEKER',
    glyph: '◎',
    hex: colors.class.SEEKER,
    compMin: 0.3,
    signaMin: null,
    meaning: 'Active explorers. High prompts, low refinement.',
  },
  'K.07': {
    id: 'K.07',
    name: 'REFINER',
    glyph: '⟳',
    hex: colors.class.REFINER,
    compMin: 0.2,
    signaMin: null,
    meaning: 'Practicing with purpose. Consistent mid-tier.',
  },
  'K.08': {
    id: 'K.08',
    name: 'BEARER',
    glyph: '◇',
    hex: colors.class.BEARER,
    compMin: 0.15,
    signaMin: null,
    meaning: 'Quiet insight holders. Deep threads, low activity.',
  },
  'K.09': {
    id: 'K.09',
    name: 'IGNITER',
    glyph: '·',
    hex: colors.class.IGNITER,
    compMin: 0,
    signaMin: null,
    meaning: 'Dormant potential. The still soul. Waiting.',
  },
}

/** Map a public SignalClass name back to its canonical K.xx id. */
export const CLASS_NAME_TO_ID: Record<SignalClass, string> = Object.values(
  CLASS_TIERS,
).reduce(
  (acc, tier) => {
    acc[tier.name] = tier.id
    return acc
  },
  {} as Record<SignalClass, string>,
)

/** Map a public SignalClass name to its canonical K.xx glyph (◈ ▲ ▽ ⬡ ↓ ◎ ⟳ ◇ ·).
 * Single source of truth for the leaderboard class mark (LB-5), hall dropdowns,
 * and operator profile — read from CLASS_TIERS so glyphs stay canon-locked. */
export const CLASS_NAME_TO_GLYPH: Record<SignalClass, string> = Object.values(
  CLASS_TIERS,
).reduce(
  (acc, tier) => {
    acc[tier.name] = tier.glyph
    return acc
  },
  {} as Record<SignalClass, string>,
)

/** Canonical glyph for a SignalClass name (falls back to '·' / IGNITER). */
export function glyphFor(name: SignalClass): string {
  return CLASS_NAME_TO_GLYPH[name] ?? '·'
}

export interface WindowDef {
  /** Canonical ID, e.g. "W.01". */
  id: string
  /** UI label as shown to operators. */
  label: string
  /** API/DB window_type enum value. */
  api: string
}

/**
 * WINDOWS — the scoring windows (CANON T.12). UI labels map to API enums in
 * lib/constants.ts (WINDOW_API_MAP); this is the canonical-id registry.
 */
export const WINDOWS: Record<string, WindowDef> = {
  'W.01': { id: 'W.01', label: 'Daily', api: 'today' },
  'W.02': { id: 'W.02', label: '30', api: '30d' },
  // W.03 (60) RETIRED 2026-06-19 — the "730" set is 7/30/90/all-time (token-dashboard
  // + canon); no 60d aggregation. ID tombstoned (not reused — canon IDs are stable).
  'W.04': { id: 'W.04', label: '90', api: '90d' },
  'W.05': { id: 'W.05', label: 'All time', api: 'all_time' },
}

export interface PlatformDef {
  /** Canonical ID, e.g. "P.01". */
  id: string
  /** UI label. */
  label: string
  /** primary_domain enum value (lowercase). */
  domain: string
  /** Hex color, when a platform brand color exists. */
  hex?: string
}

/** PLATFORMS — AI platform registry (CANON T.15). */
export const PLATFORMS: Record<string, PlatformDef> = {
  'P.01': { id: 'P.01', label: 'Claude', domain: 'claude', hex: colors.platform.Claude },
  'P.02': { id: 'P.02', label: 'ChatGPT', domain: 'chatgpt', hex: colors.platform.ChatGPT },
  'P.03': { id: 'P.03', label: 'Gemini', domain: 'gemini', hex: colors.platform.Gemini },
  'P.04': { id: 'P.04', label: 'Pi', domain: 'pi', hex: colors.platform.Pi },
  'P.05': { id: 'P.05', label: 'Multi', domain: 'multi' },
  'P.06': { id: 'P.06', label: 'Other', domain: 'other' },
}

export type BadgeCategory = 'Structural' | 'Event' | 'Prestige' | 'Audit' | 'Patron'
export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface BadgeDef {
  /** Canonical ID, e.g. "BG.01". */
  id: string
  /** Badge name. */
  name: string
  category: BadgeCategory
  rarity: BadgeRarity
  /** Award criteria (public summary). */
  criteria: string
  /** Display glyph. */
  glyph: string
}

/** BADGES — the canonical badge catalog BG.01..BG.16 (BADGE_LEDGER.md). */
export const BADGES: Record<string, BadgeDef> = {
  'BG.01': {
    id: 'BG.01',
    name: '5x Crown',
    category: 'Structural',
    rarity: 'Epic',
    criteria: 'Held #1 in all 5 Core metrics simultaneously (single window).',
    glyph: '⭐',
  },
  'BG.02': {
    id: 'BG.02',
    name: 'Transmitter Class',
    category: 'Structural',
    rarity: 'Rare',
    criteria: 'Compression ≥ 0.85 AND SIGNA RATE ≥ 85.',
    glyph: '◈',
  },
  'BG.03': {
    id: 'BG.03',
    name: 'Architect Lock',
    category: 'Prestige',
    rarity: 'Rare',
    criteria: 'Sustained ARCHITECT+ class for 14+ days.',
    glyph: '▲',
  },
  'BG.04': {
    id: 'BG.04',
    name: 'Crossweaver',
    category: 'Structural',
    rarity: 'Rare',
    criteria: 'CT score in top 1% for the window.',
    glyph: '🌊',
  },
  'BG.05': {
    id: 'BG.05',
    name: 'Deep Channel',
    category: 'Structural',
    rarity: 'Rare',
    criteria: 'Session Depth raw ≥ 30 sustained 7 days.',
    glyph: '⌬',
  },
  'BG.06': {
    id: 'BG.06',
    name: 'Compression Forge',
    category: 'Structural',
    rarity: 'Epic',
    criteria: 'Compression ≥ 0.85 sustained through MV in top 10% (busy AND clean).',
    glyph: '⚒',
  },
  'BG.07': {
    id: 'BG.07',
    name: 'Audit Verified',
    category: 'Audit',
    rarity: 'Rare',
    criteria: 'Pro-tier sig_army audit completed and confirmed.',
    glyph: '🛡',
  },
  'BG.08': {
    id: 'BG.08',
    name: 'Ghost Return',
    category: 'Event',
    rarity: 'Rare',
    criteria: 'Reactivation after dormancy (>30d idle, then re-publishes).',
    glyph: '👻',
  },
  'BG.09': {
    id: 'BG.09',
    name: 'Lightning Strike',
    category: 'Event',
    rarity: 'Epic',
    criteria: 'Largest 24h SIGNA RATE rise on the leaderboard for that day.',
    glyph: '⚡',
  },
  'BG.10': {
    id: 'BG.10',
    name: 'Quiet Giant',
    category: 'Structural',
    rarity: 'Rare',
    criteria: 'Compression ≥ 0.85 AND Turn Volume in bottom 50%.',
    glyph: '❄',
  },
  'BG.11': {
    id: 'BG.11',
    name: 'Iron Streak',
    category: 'Prestige',
    rarity: 'Rare',
    criteria: '30+ consecutive active days.',
    glyph: '🔥',
  },
  'BG.12': {
    id: 'BG.12',
    name: 'Fivefold Hold',
    category: 'Prestige',
    rarity: 'Legendary',
    criteria: 'Held BG.01 (5x Crown) for 7+ consecutive days.',
    glyph: '⭐⭐⭐⭐⭐',
  },
  'BG.13': {
    id: 'BG.13',
    name: 'First Transmitter',
    category: 'Event',
    rarity: 'Legendary',
    criteria: 'First-ever Transmitter-class assignment in their platform region.',
    glyph: '◈⃝',
  },
  'BG.14': {
    id: 'BG.14',
    name: 'Signal Patron',
    category: 'Patron',
    rarity: 'Common',
    criteria: 'Active Supporter tier (any payment).',
    glyph: '🍻',
  },
  'BG.15': {
    id: 'BG.15',
    name: 'Circle Founder',
    category: 'Event',
    rarity: 'Rare',
    criteria: 'Founded a Circle with ≥ 5 active members.',
    glyph: '🏛',
  },
  'BG.16': {
    id: 'BG.16',
    name: 'Hall of Signal',
    category: 'Event',
    rarity: 'Legendary',
    criteria: 'Recipient of any Hall of Signal record.',
    glyph: '🏆',
  },
}

export type RewardSource = 'class' | 'badge' | 'supporter' | 'hall'

export interface RewardDef {
  /** Canonical ID, e.g. "RW.01". */
  id: string
  /** What grants this reward. */
  source: RewardSource
  /** Source canonical id (K.xx / BG.xx / supporter tier / hall record). */
  sourceRef: string
  /** Reward description. */
  reward: string
}

/** REWARDS — the canonical reward catalog RW.01..RW.34 (REWARD_TIERS.md). */
export const REWARDS: Record<string, RewardDef> = {
  // Class-tier rewards
  'RW.01': { id: 'RW.01', source: 'class', sourceRef: 'K.01', reward: 'Featured carousel placement (home page).' },
  'RW.02': { id: 'RW.02', source: 'class', sourceRef: 'K.01', reward: 'Verified badge frame on profile.' },
  'RW.03': { id: 'RW.03', source: 'class', sourceRef: 'K.01', reward: 'Priority audit queue access.' },
  'RW.04': { id: 'RW.04', source: 'class', sourceRef: 'K.02', reward: 'Profile glyph upgrade.' },
  'RW.05': { id: 'RW.05', source: 'class', sourceRef: 'K.02', reward: 'Trend chart extended history (365d vs default 90d).' },
  'RW.06': { id: 'RW.06', source: 'class', sourceRef: 'K.03', reward: 'Per-metric historical drilldown unlocked.' },
  'RW.07': { id: 'RW.07', source: 'class', sourceRef: 'K.04', reward: 'Compare engine — vs class average.' },
  'RW.08': { id: 'RW.08', source: 'class', sourceRef: 'K.05', reward: 'Standard profile features (baseline).' },
  'RW.09': { id: 'RW.09', source: 'class', sourceRef: 'K.06', reward: 'Public profile + leaderboard inclusion.' },
  // Badge rewards
  'RW.10': { id: 'RW.10', source: 'badge', sourceRef: 'BG.01', reward: 'Permanent crown glyph on codename.' },
  'RW.11': { id: 'RW.11', source: 'badge', sourceRef: 'BG.07', reward: '"✓ Audit Verified" pill on profile.' },
  'RW.12': { id: 'RW.12', source: 'badge', sourceRef: 'BG.09', reward: '"⚡ Largest Rise — [date]" stamp.' },
  'RW.13': { id: 'RW.13', source: 'badge', sourceRef: 'BG.12', reward: 'Hall of Signal nomination (auto).' },
  'RW.14': { id: 'RW.14', source: 'badge', sourceRef: 'BG.13', reward: 'Permanent founder flair (gold border).' },
  'RW.15': { id: 'RW.15', source: 'badge', sourceRef: 'BG.16', reward: 'Profile page reserved spot in Hall page.' },
  // Supporter-tier rewards
  'RW.16': { id: 'RW.16', source: 'supporter', sourceRef: 'patron', reward: '"🍻 Patron" badge (BG.14).' },
  'RW.17': { id: 'RW.17', source: 'supporter', sourceRef: 'patron', reward: 'Ad-free site (when ads land — currently none).' },
  'RW.18': { id: 'RW.18', source: 'supporter', sourceRef: 'patron', reward: 'Listed in random supporter carousel.' },
  'RW.19': { id: 'RW.19', source: 'supporter', sourceRef: 'pro', reward: 'All Patron rewards.' },
  'RW.20': { id: 'RW.20', source: 'supporter', sourceRef: 'pro', reward: 'sig_army Pro audit (precision-tier scoring).' },
  'RW.21': { id: 'RW.21', source: 'supporter', sourceRef: 'pro', reward: 'Drift Ratio (E.02) computed.' },
  'RW.22': { id: 'RW.22', source: 'supporter', sourceRef: 'pro', reward: 'Score decomposition view.' },
  'RW.23': { id: 'RW.23', source: 'supporter', sourceRef: 'pro', reward: 'Unlimited history depth.' },
  'RW.24': { id: 'RW.24', source: 'supporter', sourceRef: 'pro', reward: 'API access (read + submit).' },
  'RW.25': { id: 'RW.25', source: 'supporter', sourceRef: 'circle_sponsor', reward: 'Circle logo in supporter carousel (header + footer).' },
  'RW.26': { id: 'RW.26', source: 'supporter', sourceRef: 'circle_sponsor', reward: 'All members of circle get Patron-tier rewards.' },
  'RW.27': { id: 'RW.27', source: 'supporter', sourceRef: 'circle_sponsor', reward: 'Recruitment policy flag on circle page.' },
  // Hall of Signal rewards
  'RW.28': { id: 'RW.28', source: 'hall', sourceRef: 'highest_compression', reward: 'Highest Compression Ever — stamped on Hall page.' },
  'RW.29': { id: 'RW.29', source: 'hall', sourceRef: 'deepest_session', reward: 'Deepest Single Session — stamped on Hall page.' },
  'RW.30': { id: 'RW.30', source: 'hall', sourceRef: 'most_cross_thread', reward: 'Most Cross-Thread Continuity — stamped on Hall page.' },
  'RW.31': { id: 'RW.31', source: 'hall', sourceRef: 'longest_transmitter_streak', reward: 'Longest Transmitter Streak — stamped on Hall page.' },
  'RW.32': { id: 'RW.32', source: 'hall', sourceRef: 'largest_24h_climb', reward: 'Largest 24h Rank Climb — stamped on Hall page.' },
  'RW.33': { id: 'RW.33', source: 'hall', sourceRef: 'first_verified_transmitter', reward: 'First Verified Transmitter — stamped on Hall page.' },
  'RW.34': { id: 'RW.34', source: 'hall', sourceRef: 'fivefold_hold', reward: 'Fivefold Hold Recipients — listed on Hall page (multi-recipient).' },
}

/**
 * CanonId — the union of every canonical id string the app may reference.
 * Used by the <CanonId/> superscript component to validate real values.
 */
export type CanonId =
  | `M.${string}`
  | `B.${string}`
  | `C.${string}`
  | `E.${string}`
  | `Y.${string}`
  | `K.${string}`
  | `W.${string}`
  | `P.${string}`
  | `T.${string}`
  | `R.${string}`
  | `RS.${string}`
  | `S.${string}`
  | `BG.${string}`
  | `RW.${string}`
