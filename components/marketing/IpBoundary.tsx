import React from 'react'

interface Item {
  title: string
  detail: string
}

/**
 * IpBoundary — "What we open. What we keep." Two columns of 8 items each from
 * intro.html. The proprietary column deliberately enumerates the RS.xx engine
 * pieces (weights, breakpoints, curves) WITHOUT exposing any value — those live
 * server-only in lib/scoring/ruleset.ts. Server component, static copy.
 */
const OPEN: Item[] = [
  { title: 'The Υ Yield formula', detail: '(cache_read · output) / input² — the rank metric, in the open' },
  { title: 'Local agent source code', detail: 'Every line auditable · See exactly what gets sent' },
  { title: 'Snapshot payload schema', detail: 'The exact four token pillars that cross the network' },
  { title: 'Cascade metric definitions', detail: 'SNR, Leverage, Velocity, 10xDEV — every formula published' },
  { title: 'Class taxonomy and tier names', detail: '9 classes from Transmitter to Igniter' },
  // TODO(ABT-8): ed25519 retired (per launch-state) — softened off the retired scheme. Owner: confirm the current signing story.
  { title: 'Privacy guarantees', detail: 'No raw transcripts · signed snapshots · verifiable counts' },
  { title: 'Adapter SDK + public REST API', detail: 'Build integrations · Read boards, profiles, snapshots' },
  { title: 'Ruleset version history', detail: 'Every change documented and replayable' },
]

const PROPRIETARY: Item[] = [
  { title: 'Class threshold breakpoints', detail: 'The exact SNR / 10xDEV cuts. Why "rare" stays rare.' },
  { title: 'Species classifier weights', detail: 'The velocity / leverage quadrant boundaries' },
  { title: 'Promotion stickiness rules', detail: 'How a class is held vs. demoted across windows' },
  { title: 'Recency modifier curves', detail: 'How live rankings decay with inactivity' },
  { title: 'Anti-gaming detection', detail: 'Pattern matching against spam, redundancy, synthetic inflation' },
  { title: 'Reader-robustness normalization', detail: 'Holding rank stable across token readers (RS.xx)' },
  { title: 'The verification battery', detail: 'The deeper signal-integrity checks behind the audit tier' },
  { title: 'Corpus + MO§ES anchor', detail: 'The verified seed that makes the field hard to clone' },
]

export function IpBoundary() {
  return (
    <section className="my-16">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        ⊙ The IP boundary
      </div>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        What we open. What we keep.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
        Trust requires transparency. A leaderboard requires a moat. We open
        everything that proves the system is honest — and keep everything that
        prevents it from being gamed or cloned.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Column
          icon="⊕"
          label="Open source"
          heading="What we publish"
          tagline="Everything that makes the privacy claim verifiable. Read the code. Inspect the schema. Trust by audit, not promise."
          items={OPEN}
          variant="open"
        />
        <Column
          icon="⊘"
          label="Proprietary"
          heading="What we keep"
          tagline="The moat. The math that prevents gaming and cloning. Without these, anyone could rebuild a clone with our data and undercut the leaderboard."
          items={PROPRIETARY}
          variant="lock"
        />
      </div>
    </section>
  )
}

function Column({
  icon,
  label,
  heading,
  tagline,
  items,
  variant,
}: {
  icon: string
  label: string
  heading: string
  tagline: string
  items: Item[]
  variant: 'open' | 'lock'
}) {
  const isLock = variant === 'lock'
  return (
    <div
      className={
        'rounded-xl border p-7 ' +
        (isLock
          ? 'border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface'
          : 'border-bg-border-subtle bg-bg-surface')
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className={
            'flex h-9 w-9 items-center justify-center rounded-lg border text-base ' +
            (isLock
              ? 'border-gold/25 bg-gold/10 text-gold'
              : 'border-bg-border bg-bg-elevated text-text-secondary')
          }
        >
          {icon}
        </div>
        <div>
          <div
            className={
              'font-mono text-xs uppercase tracking-wide ' +
              (isLock ? 'text-gold' : 'text-text-muted')
            }
          >
            {label}
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-text-primary">
            {heading}
          </h3>
        </div>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-text-secondary">{tagline}</p>
      <ul>
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 border-b border-bg-border-subtle py-3 last:border-b-0"
          >
            <span
              className={
                'w-4 shrink-0 text-center font-mono font-semibold ' +
                (isLock ? 'text-gold' : 'text-class-seeker')
              }
            >
              {isLock ? '⊘' : '✓'}
            </span>
            <span>
              <strong className="font-semibold text-text-primary">{item.title}</strong>
              <small className="mt-0.5 block font-mono text-xs text-text-muted">
                {item.detail}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
