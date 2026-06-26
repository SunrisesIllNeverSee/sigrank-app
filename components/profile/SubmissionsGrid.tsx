/**
 * components/profile/SubmissionsGrid.tsx — the operator's Submissions tab grid.
 *
 * FIX I3 (owner 2026-06-26): "a user's profile should show ALL their submissions —
 * claude/codex/multi × 7/30/90/all." One ROW per platform the operator has submitted,
 * one COLUMN per window. A filled cell shows that submission's Υ Yield + class; an
 * empty cell is a dim "—" so the operator sees what's left to submit. Per-platform
 * rows populate as FIX H (migration 0015) multi-platform submissions land — today an
 * operator typically has the one claude row across its windows.
 *
 * Presentational + server-rendered (no client island): the data comes pre-resolved
 * from getOperatorSubmissions() in the profile page.
 */
import type { OperatorSubmission } from '@/lib/data'

// Window columns in the owner's order (7 · 30 · 90 · all).
const WINDOW_ORDER = ['7d', '30d', '90d', 'all_time'] as const
const WINDOW_HEAD: Record<string, string> = {
  '7d': '7D', '30d': '30D', '90d': '90D', all_time: 'ALL', today: 'TODAY',
}
const PLATFORM_HEAD: Record<string, string> = {
  claude: 'Claude', codex: 'Codex', chatgpt: 'ChatGPT', gemini: 'Gemini',
  pi: 'Pi', devin: 'Devin', multi: 'Multi', other: 'Other',
}

const fmtY = (n: number | null): string =>
  n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0)

export function SubmissionsGrid({ submissions }: { submissions: OperatorSubmission[] }) {
  // Index every cell by "platform|window" for O(1) lookup while laying out the grid.
  const byKey = new Map<string, OperatorSubmission>()
  for (const s of submissions) byKey.set(`${s.platform}|${s.window}`, s)

  // Rows = the distinct platforms the operator has submitted, claude first then A–Z.
  const platforms = [...new Set(submissions.map((s) => s.platform))].sort((a, b) =>
    a === 'claude' ? -1 : b === 'claude' ? 1 : a.localeCompare(b),
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-xs leading-relaxed text-text-secondary">
        Every verified submission, one cell per{' '}
        <strong className="text-text-primary">platform × window</strong> — each showing its{' '}
        <strong className="text-text-primary">Υ Yield</strong> and class. Submit more windows or
        platforms from the local agent to fill the grid.
      </p>
      <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left font-normal text-text-dim">Platform</th>
              {WINDOW_ORDER.map((w) => (
                <th key={w} className="px-3 py-2 text-right font-normal text-text-dim">
                  {WINDOW_HEAD[w]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {platforms.map((p) => (
              <tr key={p} className="border-t border-bg-border">
                <td className="px-3 py-2 text-left text-text-primary">{PLATFORM_HEAD[p] ?? p}</td>
                {WINDOW_ORDER.map((w) => {
                  const cell = byKey.get(`${p}|${w}`)
                  return (
                    <td key={w} className="px-3 py-2 text-right align-top">
                      {cell ? (
                        <span className="inline-flex flex-col items-end gap-0.5">
                          <span className="text-text-primary">Υ {fmtY(cell.yield_)}</span>
                          <span className="text-[10px] uppercase tracking-wide text-text-secondary">
                            {cell.classTier}
                          </span>
                        </span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
