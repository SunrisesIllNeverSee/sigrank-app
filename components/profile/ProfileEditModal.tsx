'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { ProfileEditForm, type ProfileInitial } from '@/components/auth/ProfileEditForm'

/**
 * components/profile/ProfileEditModal.tsx — owner-only "Edit profile" button + modal
 * (AUTH_LAUNCH_DIRECTIVES D6: identity editing in the profile, as a popup).
 *
 * Renders nothing unless the signed-in operator owns the profile being viewed: GET
 * /api/v1/profile returns the session operator's codename + editable fields, and we show
 * the control only when that codename matches this profile. The modal hosts the shared
 * ProfileEditForm, prefilled from that response; on save it closes and refreshes.
 */
interface ProfileData extends ProfileInitial {
  codename: string
}

export function ProfileEditModal({ codename }: { codename: string }) {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/v1/profile', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (alive) setData((d?.operator as ProfileData | null) ?? null)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Owner-only: the session operator must be the operator on this profile.
  if (!data || data.codename !== codename) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
      >
        Edit profile
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="my-4 w-full max-w-lg rounded-lg border border-bg-border bg-bg-base p-6 shadow-xl sm:my-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
                  Edit profile
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded px-2 py-1 font-mono text-sm text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              <ProfileEditForm
                initial={data}
                onSaved={() => {
                  setOpen(false)
                  router.refresh()
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
