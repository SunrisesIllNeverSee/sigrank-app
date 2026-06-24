'use client'

import React, { useState } from 'react'
import { PLATFORM_UI, WINDOW_UI, WINDOW_API_MAP } from '@/lib/constants'

/**
 * SubmitForm — the inline web submission form (vCard-generator equivalent) for
 * operators who don't run the CLI. Manual metric entry → POST /api/v1/snapshots.
 *
 * Client component (form state + fetch). It posts a SnapshotPayload-shaped body
 * with `confidence: 'low'` so the server marks the resulting Prompt Complexity
 * as a free-tier estimate (reduced-confidence indicator). The endpoint may not
 * be wired yet; the form degrades gracefully and reports the response status.
 *
 * No module-scope clock/RNG. `window_end` is read only inside the submit
 * handler (user action time), never at render.
 */

interface MetricField {
  key: string
  label: string
  hint: string
  placeholder: string
}

const FIELDS: MetricField[] = [
  { key: 'codename', label: 'Codename', hint: 'Your anonymous operator handle', placeholder: 'e.g. SignalRunner' },
  { key: 'output_tokens', label: 'Output tokens', hint: 'Total output tokens this window', placeholder: '1200000' },
  { key: 'fresh_input_tokens', label: 'Fresh input tokens', hint: 'Non-cached input tokens', placeholder: '90000' },
  { key: 'total_tokens', label: 'Total tokens', hint: 'All tokens this window', placeholder: '4200000' },
  { key: 'sessions_count', label: 'Sessions', hint: 'Distinct sessions', placeholder: '14' },
  { key: 'turns_total', label: 'Turns', hint: 'Total reply turns', placeholder: '4180' },
  { key: 'message_volume', label: 'Turn volume', hint: 'Turns this window', placeholder: '2300' },
  { key: 'account_age_days', label: 'Account age (days)', hint: 'Lifetime account age', placeholder: '64' },
  { key: 'total_messages_lifetime', label: 'Total turns (lifetime)', hint: 'All-time turns', placeholder: '27600' },
]

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; detail: string }
  | { kind: 'error'; detail: string }

export function SubmitForm() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [platform, setPlatform] = useState<string>(PLATFORM_UI[1]) // 'Claude'
  const [windowLabel, setWindowLabel] = useState<string>('30')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  function setField(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus({ kind: 'submitting' })

    const num = (k: string) => Number(values[k] ?? 0) || 0
    const now = new Date() // read only on user action, never at module scope
    const payload = {
      schema_version: '1.0' as const,
      codename: values.codename ?? '',
      // Manual entries are flagged low-confidence so the server records the
      // free-tier estimate (reduced-confidence indicator) for Prompt Complexity.
      confidence: 'low' as const,
      window_type: WINDOW_API_MAP[windowLabel as keyof typeof WINDOW_API_MAP] ?? '30d',
      window_end: now.toISOString(),
      telemetry: {
        output_tokens: num('output_tokens'),
        fresh_input_tokens: num('fresh_input_tokens'),
        total_tokens: num('total_tokens'),
        sessions_count: num('sessions_count'),
        turns_total: num('turns_total'),
        message_volume: num('message_volume'),
        account_age_days: num('account_age_days'),
        total_messages_lifetime: num('total_messages_lifetime'),
        platform: { primary: platform.toLowerCase(), models: [] as string[] },
      },
      source: 'web_manual',
    }

    try {
      const res = await fetch('/api/v1/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus({
          kind: 'ok',
          detail: 'Snapshot received. Manual entries are scored at reduced confidence.',
        })
      } else {
        const text = await res.text().catch(() => '')
        setStatus({
          kind: 'error',
          detail: `Submission rejected (${res.status}). ${text}`.trim(),
        })
      }
    } catch (err) {
      setStatus({
        kind: 'error',
        detail:
          'Could not reach the submission endpoint. The API may not be configured in this environment.',
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-bg-border-subtle bg-bg-surface p-6">
      <div className="mb-4 rounded-lg border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-text-secondary">
        <strong className="font-semibold text-gold">Reduced confidence:</strong>{' '}
        Manual web entries are scored with free-tier proxies and marked{' '}
        <span className="font-mono text-text-primary">confidence: low</span>. For
        exact cascade metrics, run the CLI agent or upgrade to Pro.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Platform selector */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Platform</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary"
          >
            {PLATFORM_UI.filter((p) => p !== 'All').map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        {/* Window selector */}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-secondary">Window</span>
          <select
            value={windowLabel}
            onChange={(e) => setWindowLabel(e.target.value)}
            className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary"
          >
            {WINDOW_UI.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">{f.label}</span>
            <input
              type={f.key === 'codename' ? 'text' : 'number'}
              inputMode={f.key === 'codename' ? 'text' : 'numeric'}
              value={values[f.key] ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim"
              required={f.key === 'codename'}
              aria-describedby={`hint-${f.key}`}
              aria-required={f.key === 'codename' ? 'true' : undefined}
            />
            <span id={`hint-${f.key}`} className="text-[11px] text-text-muted">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status.kind === 'submitting'}
          className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-60"
        >
          {status.kind === 'submitting' ? 'Submitting…' : 'Submit snapshot'}
        </button>

        <span role="status" aria-live="polite">
          {status.kind === 'ok' && (
            <span className="text-sm text-class-seeker">{status.detail}</span>
          )}
          {status.kind === 'error' && (
            <span className="text-sm text-class-refiner">{status.detail}</span>
          )}
        </span>
      </div>
    </form>
  )
}
