'use client'

/**
 * CopyButton — a client-side copy-to-clipboard button for command snippets.
 *
 * Renders as a small icon+label button. On click, writes the command to the
 * clipboard and shows "Copied ✓" for 1.5s. Falls back silently if the
 * clipboard API is blocked (the command is visible to copy manually).
 */
import { useCallback, useState } from 'react'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the command is visible to copy manually */
    }
  }, [text])

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md border border-bg-border px-2.5 py-1 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
      aria-label={`Copy ${text}`}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  )
}
