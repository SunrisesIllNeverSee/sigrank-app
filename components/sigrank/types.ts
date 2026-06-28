export type SignalClass =
  | 'TRANSMITTER'
  | 'ARCH+'
  | 'ARCH'
  | 'POWER'
  | 'BASE'
  | 'SEEKER'
  | 'REFINER'
  | 'BEARER'
  | 'IGNITER'

export type MetricView =
  | 'yield'
  | 'leverage'
  | 'snr'
  | 'dev10x'
  | 'message-volume'
  | 'compression-ratio'
  | 'x-referencing'
  | 'session-depth'
  | 'prompt-complexity'

export type Platform = 'ChatGPT' | 'Claude' | 'Pi' | 'Gemini'

export interface LeaderboardEntry {
  rank: number
  anonId: string
  /** Generated codename — the STABLE profile-route key (/user/<codename>). The board
   *  links by this, never by anonId: anonId may be a display_name (e.g. "MO§ES™") which
   *  the profile lookup can't resolve, so linking by anonId 404s. */
  codename: string
  /** Operator-cell 2nd line (BlitzStars-style): real handle for seed operators. */
  subLabel?: string
  /** True for frozen seed-corpus rows (placeholders) — rendered italic. */
  isSeed?: boolean
  location?: string
  /** Per-submission platform (lowercase, e.g. 'claude'/'codex'/'multi') for the
   *  client-side platform filter (LB-4) + the platform column. Absent → 'other'. */
  platform?: string
  /** Row window bucket ('7d'/'30d'/'90d'/'all_time'), FIX H. Rendered as a label on
   *  the "off" board so an operator's per-(platform, window) rows read as intentional
   *  breakouts, not duplicates. Undefined on single-window boards (redundant there). */
  window?: string
  signalClass: SignalClass
  /** Υ Yield = leverage × velocity. Primary rank metric. null = non-compounding platform. */
  yield_?: number | null
  /** Leverage = cache_read / input. Reads per fresh token. null = non-compounding. */
  leverage?: number | null
  /** SNR = output / (input + output). Compression ratio alias. */
  snr?: number
  /** 10xDEV = log₁₀(T × C × R). null = non-compounding. */
  dev10x?: number | null
  /** Velocity = output / input. */
  velocity?: number | null
  /** Total tokens = input + output + cache_write + cache_read. The scale legitimizer. */
  totalTokens?: number | null
  // ── Raw pillars (the "show your work" raw-pillars board view). Populated from
  //    telemetry on EVERY row (independent of compounding) so the raw view always
  //    renders real integers even where the derived cascade metrics read "—". ──
  /** Raw pillar — fresh input tokens. */
  input?: number | null
  /** Raw pillar — output tokens. */
  output?: number | null
  /** Raw pillar — cache-write (cache_creation) tokens. */
  cacheWrite?: number | null
  /** Raw pillar — cache-read tokens. */
  cacheRead?: number | null
  /** Scale V = log₁₀(total tokens). */
  scaleV?: number | null
  /** Blended $/1M tokens. */
  costPerMillion?: number | null
  /** Efficiency = ((cache + output)/input)/4.0. */
  efficiency?: number | null
  /** Operating ratio "cr:1:o/i" composition shorthand. */
  opRatio?: string
  snRatio?: number
  messageVolume?: number
  sessionDepth?: number
  promptComplexity?: number
  threadsRecalled?: number
  compositeScore?: number
  acctAge: string
  /** Snapshot date ('YYYY-MM-DD') of this scored window — the LAST column. Null when
   *  the row has no snapshot_date (legacy rows); the table renders it as "—". */
  lastSeen: string | null
}

export interface ProfileMetric {
  label: string
  score: number
  rank: number
}

export interface UserProfile {
  id: string
  rank: number
  tier: string
  compositeScore: number
  metrics: ProfileMetric[]
}

export interface K2ClassEntry {
  signalClass: SignalClass
  trait: string
  liveCount: number
  maxCount?: number
}

export interface RegionalCount {
  region: string
  count: number
}

export interface CrossPlatformEntry {
  rank: number
  username: string
  platform: Platform
  transmitter: number
  sdrm: number
  signalForce: number
}

export interface SystemMetricRow {
  label: string
  avgUser: number
  avgAI: number
  userValue: number
  unit?: string
}

export interface WrappedStat {
  label: string
  value: string | number
}

export interface ActivityDay {
  date: string
  count: number
}

export interface Badge {
  name: string
  description: string
}

export interface RadarMetric {
  label: string
  value: number
  max?: number
}
