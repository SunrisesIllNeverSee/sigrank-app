// supabase/functions/sigrank-mcp/index.ts
//
// SigRank MCP Server — deployed on Supabase Edge Functions.
//
// This lets users connect their AI coding agents (Claude, Cursor, Copilot,
// etc.) to SigRank and ask natural-language questions like:
//   "What's my Yield rank?"
//   "Who are the top 10 operators by Yield?"
//   "Compare operator furic vs signal-148d593199"
//   "What metrics does SigRank track?"
//
// The MCP server exposes tools that query the SigRank public API at
// signalaf.com — no database credentials exposed, no service-role keys.
// All data is public leaderboard data.
//
// Deploy:
//   supabase functions deploy sigrank-mcp --no-verify-jwt
//
// Endpoint after deploy:
//   https://copqtaqzsdvpdbhpwjmt.supabase.co/functions/v1/sigrank-mcp
//
// Users add this URL to their MCP client config (Cursor, Claude Code, etc.)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

const SIGRANK_API = 'https://signalaf.com/api/v1'

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Fetch JSON from the SigRank public API with a timeout. */
async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(`${SIGRANK_API}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'sigrank-mcp/1.0', ...(init?.headers || {}) },
    })
    if (!res.ok) {
      return { error: `API returned ${res.status}`, status: res.status }
    }
    return await res.json()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'fetch failed' }
  } finally {
    clearTimeout(timeout)
  }
}

/** Format a number for display (compact, no excessive decimals). */
function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  if (Math.abs(n) >= 100) return n.toFixed(1)
  if (Math.abs(n) >= 1) return n.toFixed(3)
  return n.toFixed(6)
}

// ─── MCP Server ───────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'sigrank',
  version: '1.0.0',
})

// ─── Tool: get_leaderboard ────────────────────────────────────────────────
//
// Get the SigRank leaderboard. Returns ranked operators by the specified
// metric and time window.

server.registerTool(
  'get_leaderboard',
  {
    title: 'Get Leaderboard',
    description:
      'Get the SigRank leaderboard — ranked AI operators by metric. ' +
      'Metrics: yield (default), velocity, leverage, snr, dev10x, scale_v, ' +
      'efficiency, cost_per_million, op_ratio, signa_rate. ' +
      'Windows: 7d, 30d, 90d, all_time (default). ' +
      'Returns rank, codename, display_name, class_tier, platform, and metric values.',
    inputSchema: {
      metric: z.enum([
        'yield', 'velocity', 'leverage', 'snr', 'dev10x',
        'scale_v', 'efficiency', 'cost_per_million', 'op_ratio', 'signa_rate',
      ]).default('yield').describe('Sort metric (default: yield)'),
      window: z.enum(['7d', '30d', '90d', 'all_time']).default('all_time').describe('Time window (default: all_time)'),
      limit: z.number().int().min(1).max(100).default(10).describe('Number of operators to return (default: 10, max: 100)'),
    },
  },
  async ({ metric, window, limit }) => {
    const data = await fetchJson(
      `/leaderboard?metric=${metric}&window=${window}&limit=${limit}`,
    ) as { entries?: Array<Record<string, unknown>>; total_operators?: number; error?: string }

    if (data.error) {
      return { content: [{ type: 'text', text: `Error: ${data.error}` }] }
    }

    const entries = data.entries ?? []
    const lines = entries.map((e: Record<string, unknown>) => {
      const rank = e.rank
      const name = e.display_name ?? e.codename
      const cls = e.class_tier ?? ''
      const platform = e.platform ?? ''
      const y = fmt(e.yield_ as number)
      const lev = fmt(e.leverage as number)
      const vel = fmt(e.velocity as number)
      return `#${rank} ${name} [${cls}] (${platform}) — Υ ${y} | Lev ${lev} | Vel ${vel}`
    })

    const header = `SigRank Leaderboard — ${metric} / ${window} (${data.total_operators ?? entries.length} total operators)\n`
    const text = header + lines.join('\n')

    return { content: [{ type: 'text', text }] }
  },
)

// ─── Tool: get_operator ───────────────────────────────────────────────────
//
// Get a specific operator's full profile and current metrics by codename.

server.registerTool(
  'get_operator',
  {
    title: 'Get Operator Profile',
    description:
      'Get a specific operator\'s full profile, rank, and metrics by codename. ' +
      'Returns display_name, class_tier, platform, global_rank, percentile, ' +
      'yield, leverage, velocity, snr, dev10x, token counts, and more. ' +
      'Use codename (e.g. "furic", "signal-148d593199") as the identifier.',
    inputSchema: {
      codename: z.string().min(1).max(100).describe('Operator codename (e.g. "furic")'),
    },
  },
  async ({ codename }) => {
    const data = await fetchJson(`/operators/${encodeURIComponent(codename)}`) as Record<string, unknown>

    if (data.error || data.status === 'not_found' || data.status === 'retired') {
      const msg = data.status === 'retired'
        ? `Operator "${codename}" has opted out and has no public profile.`
        : data.error ? `Error: ${data.error}` : `Operator "${codename}" not found.`
      return { content: [{ type: 'text', text: msg }] }
    }

    const rank = (data.current_rank as Record<string, unknown>) ?? {}
    const metrics = (data.current_metrics as Record<string, unknown>) ?? {}
    const tokens = (data.current_tokens as Record<string, unknown>) ?? {}

    const lines = [
      `Operator: ${data.display_name ?? codename} (${codename})`,
      `Class: ${data.class_tier ?? '—'}`,
      `Platform: ${data.platform ?? '—'}`,
      `Claimed: ${data.claimed ? 'yes' : 'no'}`,
      `Verification: ${data.verification_status ?? '—'}`,
      `Supporter tier: ${data.supporter_tier ?? 'free'}`,
      ``,
      `Rank: #${rank.global ?? '—'} (percentile: ${fmt(rank.percentile as number)})`,
      ``,
      `Metrics:`,
      `  Υ Yield:      ${fmt(metrics.yield_ as number)}`,
      `  Leverage:     ${fmt(metrics.leverage as number)}`,
      `  Velocity:     ${fmt(metrics.velocity as number)}`,
      `  SNR:          ${fmt(metrics.snr as number)}`,
      `  10xDEV:       ${fmt(metrics.dev10x as number)}`,
      `  Signa Rate:   ${fmt(metrics.signa_rate as number)}`,
      `  Scale V:      ${fmt(metrics.scale_v as number)}`,
      `  Efficiency:   ${fmt(metrics.efficiency as number)}`,
      ``,
      `Tokens:`,
      `  Input:        ${fmt(tokens.input_tokens as number)}`,
      `  Output:       ${fmt(tokens.output_tokens as number)}`,
      `  Cache Read:   ${fmt(tokens.cache_read_tokens as number)}`,
      `  Cache Write:  ${fmt(tokens.cache_creation_tokens as number)}`,
      `  Total:        ${fmt(tokens.total_tokens as number)}`,
    ]

    return { content: [{ type: 'text', text: lines.join('\n') }] }
  },
)

// ─── Tool: get_metric_leaders ─────────────────────────────────────────────
//
// Get the top performers for a specific metric.

server.registerTool(
  'get_metric_leaders',
  {
    title: 'Get Metric Leaders',
    description:
      'Get the top performers for a specific SigRank metric. ' +
      'Same metrics as get_leaderboard but optimized for "who leads in X?" queries. ' +
      'Returns top operators with their metric values.',
    inputSchema: {
      metric: z.enum([
        'yield', 'velocity', 'leverage', 'snr', 'dev10x',
        'scale_v', 'efficiency', 'cost_per_million', 'op_ratio', 'signa_rate',
      ]).default('yield').describe('Metric to rank by (default: yield)'),
      limit: z.number().int().min(1).max(50).default(5).describe('Top N (default: 5, max: 50)'),
    },
  },
  async ({ metric, limit }) => {
    const data = await fetchJson(
      `/metrics/leaders?metric=${metric}&limit=${limit}`,
    ) as { entries?: Array<Record<string, unknown>>; error?: string }

    if (data.error) {
      return { content: [{ type: 'text', text: `Error: ${data.error}` }] }
    }

    const entries = data.entries ?? []
    const lines = entries.map((e: Record<string, unknown>) => {
      const rank = e.rank
      const name = e.display_name ?? e.codename
      const cls = e.class_tier ?? ''
      const val = fmt(e[metric === 'cost_per_million' ? 'cost_per_million' : metric] as number)
      return `#${rank} ${name} [${cls}] — ${metric}: ${val}`
    })

    const text = `Top ${limit} by ${metric}:\n` + lines.join('\n')
    return { content: [{ type: 'text', text }] }
  },
)

// ─── Tool: compare_operators ──────────────────────────────────────────────
//
// Compare two operators head-to-head.

server.registerTool(
  'compare_operators',
  {
    title: 'Compare Operators',
    description:
      'Compare two operators head-to-head by codename. ' +
      'Returns both operators\' key metrics side by side with winners marked. ' +
      'Useful for "who is better, X or Y?" queries.',
    inputSchema: {
      operator_a: z.string().min(1).max(100).describe('First operator codename'),
      operator_b: z.string().min(1).max(100).describe('Second operator codename'),
    },
  },
  async ({ operator_a, operator_b }) => {
    const [a, b] = await Promise.all([
      fetchJson(`/operators/${encodeURIComponent(operator_a)}`) as Promise<Record<string, unknown>>,
      fetchJson(`/operators/${encodeURIComponent(operator_b)}`) as Promise<Record<string, unknown>>,
    ])

    if (a.error || a.status === 'not_found') {
      return { content: [{ type: 'text', text: `Operator "${operator_a}" not found.` }] }
    }
    if (b.error || b.status === 'not_found') {
      return { content: [{ type: 'text', text: `Operator "${operator_b}" not found.` }] }
    }

    const aRank = (a.current_rank as Record<string, unknown>)?.global as number
    const bRank = (b.current_rank as Record<string, unknown>)?.global as number
    const aMetrics = (a.current_metrics as Record<string, unknown>) ?? {}
    const bMetrics = (b.current_metrics as Record<string, unknown>) ?? {}

    const metrics = ['yield_', 'leverage', 'velocity', 'snr', 'dev10x', 'scale_v', 'efficiency']
    const labels: Record<string, string> = {
      yield_: 'Υ Yield', leverage: 'Leverage', velocity: 'Velocity',
      snr: 'SNR', dev10x: '10xDEV', scale_v: 'Scale V', efficiency: 'Efficiency',
    }

    const lines: string[] = [
      `Comparison: ${a.display_name ?? operator_a} vs ${b.display_name ?? operator_b}`,
      ``,
      `Rank: #${aRank ?? '—'} vs #${bRank ?? '—'} → ${aRank < bRank ? a.display_name ?? operator_a : b.display_name ?? operator_b} ranks higher`,
      ``,
      `Metric           | ${a.display_name ?? operator_a} | ${b.display_name ?? operator_b} | Winner`,
      `─────────────────┼─────────────┼─────────────┼───────`,
    ]

    for (const m of metrics) {
      const av = aMetrics[m] as number
      const bv = bMetrics[m] as number
      const winner = av > bv ? '← A' : bv > av ? '← B' : 'tie'
      lines.push(`${labels[m]?.padEnd(16) ?? m.padEnd(16)}| ${fmt(av).padStart(11)} | ${fmt(bv).padStart(11)} | ${winner}`)
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] }
  },
)

// ─── Tool: get_metrics_info ───────────────────────────────────────────────
//
// Get information about SigRank metrics — what they mean and how they work.

server.registerTool(
  'get_metrics_info',
  {
    title: 'Get Metrics Info',
    description:
      'Get explanations of all SigRank metrics — what they measure, how they\'re ' +
      'calculated, and what constitutes a good score. Use when someone asks ' +
      '"what is Yield?" or "what does SNR mean?"',
    inputSchema: {},
  },
  async () => {
    const text = `SigRank Metrics — The Statistical Layer for AI Users

SigRank turns AI usage into stats, like ERA for baseball. Here are the core metrics:

Υ YIELD (the headline metric)
  Formula: (cache_read × output) / input²
  What it measures: Token-cascade efficiency — how well you reuse cached context
  to produce output without burning new input tokens. Higher = better.
  Think of it like ERA in baseball: lower spend, more output = better efficiency.

LEVERAGE
  Formula: cache_read / input
  What it measures: How much cached context you reuse vs. new input you write.
  High leverage = you're building on prior context, not re-explaining.

VELOCITY
  Formula: output / input
  What it measures: Output tokens per input token. How much you get out per
  token you put in. High velocity = efficient prompting.

SNR (Signal-to-Noise Ratio)
  What it measures: Compression ratio — how clean your signal is.
  High SNR = your output is dense signal, not verbose noise.

10xDEV
  Formula: log₁₀(Leverage)
  What it measures: Logarithmic leverage score. A 10xDEV of 4 means 10,000×
  leverage. The log scale makes comparisons across orders of magnitude readable.

SCALE V
  What it measures: Logarithmic scale of total token throughput.
  Shows the sheer volume of AI work being done.

EFFICIENCY
  What it measures: Output value per token cost. Combines velocity and cost.

COST PER MILLION
  What it measures: Dollar cost per million tokens processed.
  Lower = more cost-efficient.

OP RATIO
  Format: leverage:1:velocity (e.g. "30345:1:81.2")
  What it measures: The operator's leverage and velocity in one compact string.

SIGNA RATE
  What it measures: Composite quality score (precision-tier metric, not always available).

SIGNAL CLASSES (tiers):
  BURNER → SEEKER → POWER → SIGNAL → BEACON → TRANSMITTER
  Each class has sub-tiers (I, II, III). Class is determined by Yield and
  other metrics — it's your skill tier, like rank in competitive gaming.

WINDOWS:
  7d, 30d, 90d, all_time — leaderboard rankings by time window.`

    return { content: [{ type: 'text', text }] }
  },
)

// ─── Tool: get_operator_history ───────────────────────────────────────────
//
// Get an operator's rank/metric history over time.

server.registerTool(
  'get_operator_history',
  {
    title: 'Get Operator History',
    description:
      'Get an operator\'s rank and metric history over time. ' +
      'Shows how their Yield, rank, and class have changed across snapshots. ' +
      'Useful for "how has operator X improved over time?" queries.',
    inputSchema: {
      codename: z.string().min(1).max(100).describe('Operator codename'),
      limit: z.number().int().min(1).max(50).default(10).describe('Number of history entries (default: 10)'),
    },
  },
  async ({ codename, limit }) => {
    const data = await fetchJson(
      `/operators/${encodeURIComponent(codename)}/history?limit=${limit}`,
    ) as { history?: Array<Record<string, unknown>>; error?: string }

    if (data.error) {
      return { content: [{ type: 'text', text: `Error: ${data.error}` }] }
    }

    const history = data.history ?? []
    if (history.length === 0) {
      return { content: [{ type: 'text', text: `No history found for "${codename}".` }] }
    }

    const lines = history.map((h: Record<string, unknown>) => {
      const date = (h.snapshot_date ?? h.created_at ?? '').toString().slice(0, 10)
      const rank = h.rank ?? h.global_rank ?? '—'
      const y = fmt(h.yield_ as number)
      const cls = h.class_tier ?? ''
      return `${date} — Rank #${rank} | Υ ${y} | ${cls}`
    })

    const text = `History for ${codename} (${history.length} entries):\n` + lines.join('\n')
    return { content: [{ type: 'text', text }] }
  },
)

// ─── Hono app + MCP transport ─────────────────────────────────────────────

const app = new Hono().basePath('/sigrank-mcp')

app.all('*', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

Deno.serve(app.fetch)
