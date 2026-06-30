import { PostHog } from 'posthog-node'

// Single reused client across warm invocations. Talks DIRECTLY to PostHog cloud
// (server-to-server — no reverse proxy needed; ad-blockers are a browser concern).
let client: PostHog | null = null

function ph(): PostHog | null {
  const key = process.env.POSTHOG_KEY
  if (!key) return null
  client ??= new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    flushAt: 1, // serverless: send on the first event...
    flushInterval: 0, // ...don't wait on a timer
  })
  return client
}

/**
 * Capture a server-side event and flush immediately (serverless-safe). No-ops when
 * POSTHOG_KEY is unset or distinctId is empty, and NEVER throws — analytics is
 * best-effort and must never break the request that triggered it. distinctId is the
 * pseudonymous codename (or operator id); pass booleans / enums / counts only as
 * properties — never token values or anything beyond what's already public.
 */
export async function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const c = ph()
    if (!c || !distinctId) return
    c.capture({ distinctId, event, properties })
    await c.flush()
  } catch {
    /* swallow — never let analytics failures surface to the caller */
  }
}
