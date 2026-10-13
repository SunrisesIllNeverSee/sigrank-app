/**
 * Sanitizers for attacker-supplied strings that flow into owner alerts
 * (email subject/body) and analytics from the unauthenticated snapshots route.
 */

const CODENAME_SAFE_RE = /^[A-Za-z0-9_-]{1,40}$/;

/** Attacker-supplied codename -> safe token, else "unknown". */
export function sanitizeNotifyCodename(codename: unknown): string {
  return typeof codename === "string" && CODENAME_SAFE_RE.test(codename)
    ? codename
    : "unknown";
}

/** Strip control chars (header/log injection) and bound length of free text. */
export function safeText(v: unknown, max = 200): string {
  return String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .slice(0, max);
}
