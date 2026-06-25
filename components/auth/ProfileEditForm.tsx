'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * components/auth/ProfileEditForm.tsx — the editable profile surface
 * (AUTH_LAUNCH_DIRECTIVES D6: identity editing lives in the profile). OPTIONAL DEPTH:
 * nothing is required — the user fills as much or as little as they want.
 *
 * Public-by-default self-promotion surface (LOCKED 2026-06-22): display_name, optional
 * handle, bio, links, location, platforms. NO visibility toggles. The only private
 * datum is the auth email, which never appears here (P5). Submits to POST
 * /api/v1/profile (auth-resolved, column-allowlisted). github/x are stored as the
 * username/handle (the profile renders github.com/<v> and x.com/<v>); site is a URL.
 */
const PLATFORMS = ['claude', 'chatgpt', 'gemini', 'pi'] as const
type Platform = (typeof PLATFORMS)[number]

const inputCls =
  'w-full rounded-md border border-bg-border bg-bg-base px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-dim focus:border-gold/50 focus:outline-none'

export interface ProfileInitial {
  display_name: string
  handle: string
  location: string
  bio: string
  links: { github?: string; site?: string; x?: string }
  operator_domains: string[]
}

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

export function ProfileEditForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initial.display_name)
  const [handle, setHandle] = useState(initial.handle)
  const [location, setLocation] = useState(initial.location)
  const [bio, setBio] = useState(initial.bio)
  const [github, setGithub] = useState(initial.links.github ?? '')
  const [site, setSite] = useState(initial.links.site ?? '')
  const [x, setX] = useState(initial.links.x ?? '')
  const [platforms, setPlatforms] = useState<Platform[]>(
    initial.operator_domains.filter((d): d is Platform =>
      (PLATFORMS as readonly string[]).includes(d),
    ),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function togglePlatform(p: Platform) {
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((v) => v !== p) : [...cur, p]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setError(null)

    const links: Record<string, string> = {}
    if (github.trim()) links.github = github.trim()
    if (site.trim()) links.site = site.trim()
    if (x.trim()) links.x = x.trim()

    try {
      const res = await fetch('/api/v1/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          handle,
          location,
          bio,
          links,
          operator_domains: platforms,
        }),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        setError(d.error || 'Could not save — please try again.')
        setStatus('error')
        return
      }
      setStatus('saved')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Display name" hint="The human label on the board. Defaults to your codename until set.">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputCls}
          placeholder="e.g. Ada L."
        />
      </Field>

      <Field label="Handle" hint="An opt-in @name. Separate from your display name; no reservation yet.">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-dim">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className={inputCls}
            placeholder="yourhandle"
          />
        </div>
      </Field>

      <Field label="Location" hint="Where you're from. Free text.">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputCls}
          placeholder="e.g. Reykjavík, IS"
        />
      </Field>

      <Field label="Bio">
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputCls}
          placeholder="A line or two about you."
        />
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-mono text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Links
          <span className="ml-2 font-sans text-[10px] normal-case tracking-normal text-text-dim">
            self-promotion · optional
          </span>
        </legend>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className={inputCls}
            placeholder="GitHub — username (e.g. torvalds)"
            aria-label="GitHub username"
          />
          <input
            type="text"
            value={x}
            onChange={(e) => setX(e.target.value)}
            className={inputCls}
            placeholder="X — handle (e.g. jack)"
            aria-label="X handle"
          />
          <input
            type="url"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={inputCls}
            placeholder="Website — https://your.site"
            aria-label="Website URL"
          />
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

      <Field label="Avatar" hint="Shown on your profile and board row. Image upload turns on with Storage (0010).">
        {/* TODO(AUTH.WIRE): upload to the `avatars` Supabase Storage bucket (0010) and
            set avatar_url. Disabled until the Storage bucket + policy land. */}
        <input
          type="file"
          accept="image/*"
          disabled
          className="font-sans text-xs text-text-dim file:mr-3 file:rounded-md file:border-0 file:bg-bg-elevated file:px-3 file:py-1.5 file:font-mono file:text-text-secondary"
        />
      </Field>

      <div className="flex flex-col gap-2 border-t border-bg-border pt-4">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-fit rounded-md bg-gold px-5 py-2.5 font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save profile'}
        </button>
        {status === 'saved' && (
          <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 font-sans text-xs text-text-secondary">
            Saved. Your profile and board row are updated.
          </p>
        )}
        {status === 'error' && error && (
          <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 font-sans text-xs text-text-secondary">
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
