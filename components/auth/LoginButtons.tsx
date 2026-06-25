'use client'

import React, { useState } from 'react'
import { signInWithGitHub } from '@/lib/supabase/auth'

/**
 * components/auth/LoginButtons.tsx — OAuth sign-in buttons.
 *
 * Client island. `onGitHub` starts the real Supabase GitHub OAuth handshake via
 * `signInWithGitHub()` (lib/supabase/auth). On success the browser navigates to
 * GitHub, so there is no success state to render here; only an error surfaces. If
 * auth is unconfigured the helper returns an honest error and never fakes a session.
 */
export function LoginButtons({ next }: { next?: string }) {
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onGitHub() {
    setBusy(true)
    setNote(null)
    const { error } = await signInWithGitHub(next)
    if (error) {
      setNote(error)
      setBusy(false)
    }
    // Success → the page unloads into GitHub's OAuth screen; nothing more to do here.
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onGitHub}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2.5 rounded-md border border-bg-border bg-bg-elevated px-4 py-2.5 font-sans text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        {busy ? 'Connecting…' : 'Continue with GitHub'}
      </button>

      {note && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 text-center font-sans text-xs text-text-secondary">
          {note}
        </p>
      )}
    </div>
  )
}
