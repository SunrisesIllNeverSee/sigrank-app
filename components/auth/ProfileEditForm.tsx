'use client'

import React, { useState } from 'react'

/**
 * components/auth/ProfileEditForm.tsx — the profile fill-out (AUTH_PROFILE_ROADMAP
 * §3.4). Login flows straight into this, with OPTIONAL DEPTH: nothing is required
 * beyond the auth link — the user fills as much or as little as they want.
 *
 * Public-by-default self-promotion surface (LOCKED 2026-06-22): display_name,
 * optional handle, bio, links (self-promotion URLs), location, platforms. There
 * are NO visibility toggles (privacy_level / *_public are dropped). The only
 * private datum is the auth email, which never appears here (P5).
 *
 * Connectable stub — ZERO backend. It never fakes persistence: submit surfaces an
 * honest "saves once sign-in lands" state. Swap the submit body for the real call
 * the moment the auth client + profile write land.
 *
 * INTEGRATION (terminal):
 *   import { getSessionOperator } from '@/lib/supabase/auth'  // prefill in the page
 *   // on submit → POST /api/v1/profile (resolves auth.uid() → operator_accounts →
 *   //   operator_id, UPDATEs only owned cols: display_name, handle, avatar_url,
 *   //   bio, links, location, operator_domains). Never codename/claimed/stripe.
 */

const PLATFORMS = ['claude', 'chatgpt', 'gemini', 'pi'] as const
type Platform = (typeof PLATFORMS)[number]

/** Self-promotion link slots (JSONB `links` map — AUTH_PROFILE_ROADMAP §3.1). */
const LINK_FIELDS = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/you' },
  { key: 'site', label: 'Website', placeholder: 'https://your.site' },
  { key: 'x', label: 'X / social', placeholder: 'https://x.com/you' },
] as const

const inputCls =
  'w-full rounded-md border border-bg-border bg-bg-base px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-dim focus:border-gold/50 focus:outline-none'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {label}
        <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
          optional
        </span>
      </span>
      {children}
      {hint && <span className="font-sans text-[11px] text-text-dim">{hint}</span>}
    </label>
  )
}

export function ProfileEditForm() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [saved, setSaved] = useState(false)

  function togglePlatform(p: Platform) {
    setPlatforms((cur) =>
      cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO(AUTH.WIRE): POST /api/v1/profile with the form values once the auth
    // client lands. Until then, never fake a save — show the honest pending state.
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Display name" hint="The human label on the board. Defaults to your codename until set.">
        <input name="display_name" type="text" className={inputCls} placeholder="e.g. Ada L." />
      </Field>

      <Field label="Handle" hint="An opt-in @name. Separate from your display name; no reservation yet.">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-dim">@</span>
          <input name="handle" type="text" className={inputCls} placeholder="yourhandle" />
        </div>
      </Field>

      <Field label="Location" hint="Where you're from. Free text.">
        <input name="location" type="text" className={inputCls} placeholder="e.g. Reykjavík, IS" />
      </Field>

      <Field label="Bio">
        <textarea name="bio" rows={3} className={inputCls} placeholder="A line or two about you." />
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Links
          <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
            self-promotion · optional
          </span>
        </legend>
        <div className="flex flex-col gap-2">
          {LINK_FIELDS.map((l) => (
            <input
              key={l.key}
              name={`links.${l.key}`}
              type="url"
              className={inputCls}
              placeholder={`${l.label} — ${l.placeholder}`}
              aria-label={l.label}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Platforms
        </legend>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = platforms.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(p)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs capitalize transition-colors ${
                  on
                    ? 'border-gold/50 bg-gold/10 text-gold'
                    : 'border-bg-border text-text-secondary hover:bg-bg-elevated'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>
      </fieldset>

      <Field label="Avatar" hint="Shown on your profile and board row. Uploads turn on with sign-in.">
        {/* TODO(AUTH.WIRE): upload to the `avatars` Supabase Storage bucket (0010) and
            set avatar_url. Disabled until Storage + auth land. */}
        <input
          name="avatar"
          type="file"
          accept="image/*"
          disabled
          className="font-sans text-xs text-text-dim file:mr-3 file:rounded-md file:border-0 file:bg-bg-elevated file:px-3 file:py-1.5 file:font-mono file:text-text-secondary"
        />
      </Field>

      <div className="flex flex-col gap-2 border-t border-bg-border pt-4">
        <button
          type="submit"
          className="w-fit rounded-md bg-gold px-5 py-2.5 font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Save profile
        </button>
        {saved && (
          <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 font-sans text-xs text-text-secondary">
            Your profile saves once sign-in is live — auth is being wired up. Nothing is stored yet.
          </p>
        )}
      </div>
    </form>
  )
}
