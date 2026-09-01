import { PostHog } from "posthog-node";

// Single reused client across warm invocations. Talks DIRECTLY to PostHog cloud
// (server-to-server — no reverse proxy needed; ad-blockers are a browser concern).
let client: PostHog | null = null;

function ph(): PostHog | null {
  const key = process.env.POSTHOG_KEY;
  if (!key) return null;
  client ??= new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    flushAt: 1, // serverless: send on the first event...
    flushInterval: 0, // ...don't wait on a timer
  });
  return client;
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
    const c = ph();
    if (!c || !distinctId) return;
    c.capture({ distinctId, event, properties });
    await c.flush();
  } catch {
    /* swallow — never let analytics failures surface to the caller */
  }
}

/**
 * Evaluate a feature flag server-side. Returns `undefined` when PostHog is
 * not configured, `false` as the default fallback, or the flag's boolean
 * value. For multivariate flags, use `getFeatureFlagVariant`.
 *
 * Server-side flag evaluation uses the distinctId to determine the rollout
 * bucket — the same user gets the same flag value on client and server.
 *
 * NEVER throws — flag evaluation is best-effort. If PostHog is down or the
 * flag doesn't exist, returns the fallback.
 */
export async function isFeatureEnabledServer(
  distinctId: string,
  key: string,
  fallback = false,
): Promise<boolean> {
  try {
    const c = ph();
    if (!c || !distinctId) return fallback;
    const result = await c.isFeatureEnabled(key, distinctId);
    return result ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Get a feature flag's variant key server-side (for multivariate flags).
 * Returns `null` when PostHog is not configured or the flag doesn't exist.
 */
export async function getFeatureFlagServer(
  distinctId: string,
  key: string,
): Promise<string | null> {
  try {
    const c = ph();
    if (!c || !distinctId) return null;
    const result = await c.getFeatureFlag(key, distinctId);
    return (result as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Get a feature flag's payload server-side (JSON config attached to a flag).
 * Returns `null` when PostHog is not configured or the flag has no payload.
 */
export async function getFeatureFlagPayloadServer<T = unknown>(
  distinctId: string,
  key: string,
): Promise<T | null> {
  try {
    const c = ph();
    if (!c || !distinctId) return null;
    const result = await c.getFeatureFlagPayload(key, distinctId);
    return (result as T) ?? null;
  } catch {
    return null;
  }
}

/**
 * Capture a server-side exception for error tracking. This feeds into
 * PostHog's Error Tracking UI alongside client-side exceptions captured
 * by `capture_exceptions: true` in the client init.
 *
 * Use this in API route catch blocks to surface server errors in PostHog.
 */
export async function captureExceptionServer(
  distinctId: string,
  error: Error | unknown,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const c = ph();
    if (!c) return;
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    c.captureException(
      error,
      distinctId || "server",
      {
        $exception_message: errMsg,
        $exception_stacktrace: errStack,
        ...properties,
      },
    );
    await c.flush();
  } catch {
    /* swallow — never let error tracking failures surface to the caller */
  }
}
