/**
 * lib/vercel/diagnostic.ts — pure validation logic for the Vercel distribution
 * diagnostic.
 *
 * Extracted from the route handler so it can be unit-tested without spinning up
 * a server. The validation is the security boundary for the public diagnostic
 * endpoint — it constrains the fetch target to HTTPS *.vercel.app deployments
 * with no credentials, no ports, and no redirect following.
 */

/** Maximum accepted input length before URL parsing is attempted. */
export const MAX_INPUT_LENGTH = 500;

/**
 * Validate and normalize a user-supplied Vercel deployment URL.
 *
 * Accepts either a bare hostname (`foo.vercel.app`) or a full HTTPS URL
 * (`https://foo.vercel.app/anything`). The returned URL is always normalized
 * to the deployment root (`/`, no search, no hash).
 *
 * Returns `null` for any input that:
 *   - is not a string or exceeds MAX_INPUT_LENGTH
 *   - is not HTTPS
 *   - does not end in `.vercel.app` (excluding the bare apex `vercel.app`)
 *   - contains credentials (username/password)
 *   - contains a port
 *
 * This is the SSRF boundary for the public diagnostic. It ensures the endpoint
 * can only be used to fetch public Vercel deployment surfaces, not arbitrary
 * hosts, internal IPs, or metadata services.
 */
export function validateDeploymentUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > MAX_INPUT_LENGTH) return null;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      !hostname.endsWith(".vercel.app") ||
      hostname === "vercel.app" ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}
