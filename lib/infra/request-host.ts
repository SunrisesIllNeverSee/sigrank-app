/** Lowercase hostname (no port) the request was served on, for analytics. */
export function requestHost(req: { headers: { get(name: string): string | null } }): string | undefined {
  const raw = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))?.split(",")[0]?.trim();
  if (!raw) return undefined;
  const host = raw.toLowerCase().replace(/:\d+$/, "");
  return host.length > 0 && host.length <= 253 ? host : undefined;
}
