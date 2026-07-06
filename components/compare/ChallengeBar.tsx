'use client'

/**
 * ChallengeBar — shows challenge state between two operators on /compare.
 *
 * Three states:
 *   active   — window is open, shows brief + countdown + submit button
 *   complete — shows winner, margin, score breakdown
 *   none     — shows "Throw Down" button to initiate a new challenge
 *
 * The Throw Down button posts to /api/v1/challenges (POST).
 * Score submission is done in signal-Areana, not inline here — ChallengeBar
 * just links out to /arena?challenge={id} when a challenge is active.
 */

import React, { useState } from 'react'
import Link from 'next/link'
import type { ActiveChallenge } from '@/lib/challenges/types'

interface ChallengeBarProps {
  codeA: string
  codeB: string
  /** Display names for A/B (preferred over codename for visible text). */
  nameA?: string
  nameB?: string
  activeChallenge: ActiveChallenge | null
}

function useCountdown(windowClose: string): string {
  const [remaining, setRemaining] = React.useState('')

  React.useEffect(() => {
    function tick() {
      const ms = new Date(windowClose).getTime() - Date.now()
      if (ms <= 0) { setRemaining('Closed'); return }
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1_000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }
    tick()
    const t = setInterval(tick, 1_000)
    return () => clearInterval(t)
  }, [windowClose])

  return remaining
}

function ActiveState({ challenge, codeA, codeB, nameA, nameB }: { challenge: ActiveChallenge; codeA: string; codeB: string; nameA?: string; nameB?: string }) {
  const countdown = useCountdown(challenge.window_close)
  const dispA = nameA ?? codeA
  const dispB = nameB ?? codeB
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-gold">
          ⚔ Throw-Down Active
        </span>
        <span className="font-mono text-xs text-text-muted">
          {countdown} remaining
        </span>
      </div>
      <p className="font-sans text-sm text-text-secondary leading-relaxed">
        <span className="font-semibold text-text-primary">{dispA}</span>
        {' vs '}
        <span className="font-semibold text-text-primary">{dispB}</span>
        {' · '}
        <span className="italic text-text-muted">{challenge.prompt_brief}</span>
      </p>
      <Link
        href={`/arena?challenge=${challenge.challenge_id}`}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-gold px-4 py-2 font-mono text-xs font-bold text-bg-base transition-colors hover:bg-gold/90"
      >
        Enter arena →
      </Link>
    </div>
  )
}

function CompleteState({ challenge, codeA, codeB, nameA, nameB }: { challenge: ActiveChallenge; codeA: string; codeB: string; nameA?: string; nameB?: string }) {
  const aWon = challenge.winner_codename === codeA
  const bWon = challenge.winner_codename === codeB
  const dispA = nameA ?? codeA
  const dispB = nameB ?? codeB

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
          ◈ Last Throw-Down
        </span>
      </div>
      <div className="grid grid-cols-3 items-center gap-2 font-mono text-sm">
        <div className={`text-right ${aWon ? 'text-gold font-bold' : 'text-text-secondary'}`}>
          {dispA}
          {aWon && <span className="ml-1 text-[10px]">▲</span>}
          <div className="text-xs text-text-muted font-normal">
            {challenge.challenger_score?.toFixed(1) ?? '—'}
          </div>
        </div>
        <div className="text-center text-xs text-text-muted">
          {challenge.margin != null ? `Δ${challenge.margin.toFixed(1)}` : 'vs'}
        </div>
        <div className={`text-left ${bWon ? 'text-gold font-bold' : 'text-text-secondary'}`}>
          {dispB}
          {bWon && <span className="ml-1 text-[10px]">▲</span>}
          <div className="text-xs text-text-muted font-normal">
            {challenge.challenged_score?.toFixed(1) ?? '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChallengeBar({ codeA, codeB, nameA, nameB, activeChallenge }: ChallengeBarProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [newChallenge, setNewChallenge] = useState<ActiveChallenge | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const challenge = newChallenge ?? activeChallenge

  async function onThrowDown() {
    setStatus('sending')
    try {
      const res = await fetch('/api/v1/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenger_codename: codeA, challenged_codename: codeB, format: 'throwdown' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrMsg(data.detail ?? 'Failed to create challenge.')
        setStatus('error')
        return
      }
      setNewChallenge({
        challenge_id:       data.challenge_id,
        status:             'active',
        format:             'throwdown',
        prompt_brief:       data.prompt_brief,
        window_open:        data.window_open,
        window_close:       data.window_close,
        challenger_codename: codeA,
        challenged_codename: codeB,
        winner_codename:    null,
        challenger_score:   null,
        challenged_score:   null,
        margin:             null,
      })
      setStatus('sent')
    } catch {
      setErrMsg('Could not reach the challenge endpoint.')
      setStatus('error')
    }
  }

  if (challenge?.status === 'active') {
    return <ActiveState challenge={challenge} codeA={codeA} codeB={codeB} nameA={nameA} nameB={nameB} />
  }

  if (challenge?.status === 'complete') {
    return (
      <div className="flex flex-col gap-3">
        <CompleteState challenge={challenge} codeA={codeA} codeB={codeB} nameA={nameA} nameB={nameB} />
        <button
          onClick={onThrowDown}
          disabled={status === 'sending'}
          className="w-fit rounded-md border border-gold/40 px-4 py-2 font-mono text-xs font-semibold text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Rematch →'}
        </button>
        {status === 'error' && <p className="text-xs text-class-refiner">{errMsg}</p>}
      </div>
    )
  }

  // No active challenge
  const dispA = nameA ?? codeA
  const dispB = nameB ?? codeB
  return (
    <div className="flex items-center gap-4 rounded-xl border border-bg-border bg-bg-surface px-4 py-3">
      <p className="font-sans text-sm text-text-muted flex-1">
        No active throw-down between{' '}
        <span className="font-semibold text-text-primary">{dispA}</span> and{' '}
        <span className="font-semibold text-text-primary">{dispB}</span>.
      </p>
      <button
        onClick={onThrowDown}
        disabled={status === 'sending'}
        className="rounded-md border border-gold/40 bg-gold/5 px-4 py-2 font-mono text-xs font-bold text-gold transition-colors hover:bg-gold/15 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : '⚔ Throw Down'}
      </button>
      {status === 'error' && <p className="text-xs text-class-refiner">{errMsg}</p>}
    </div>
  )
}
