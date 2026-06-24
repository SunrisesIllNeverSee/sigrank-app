interface Props {
  /** The canonical id to render as a superscript (e.g. "RS.07"). */
  id: string
  /** When true, the id refers to a real/verified value and renders green. */
  real?: boolean
  /** Optional tooltip text shown on hover. */
  title?: string
}

/**
 * Canonical-id superscript marker. Attaches a small mono superscript to a
 * value, signalling its canonical source id. Real (verified) ids render green.
 */
// Disabled (owner 2026-06-21): the canon-id superscripts were a metric-hardening-era
// marker (the green "verified" tags) — no longer needed. Render nothing, so every call
// site site-wide stops showing them without touching each one. Props kept for back-compat.
export function CanonId(_props: Props) {
  return null
}
