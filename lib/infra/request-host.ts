const SITE_HOSTS = new Set(["signalaf.com", "www.signalaf.com", "analyst.signalaf.com", "localhost"]);

/**
 * Site the request was served on, for analytics: an allow-listed hostname,
 * "preview" for *.vercel.app, otherwise "other". Raw client-controlled host
 * values are never returned. x-forwarded-host is trusted only when it maps to
 * a known site; otherwise the Host header decides.
 */
export function requestHost(req: { headers: { get(name: string): string | null } }): string | undefined {
  const classify = (raw: string | null | undefined): string | undefined => {
    const host = raw?.split(",")[0]?.trim().toLowerCase().replace(/:\d+$/, "");
    if (!host) return undefined;
    if (SITE_HOSTS.has(host)) return host;
    if (host.endsWith(".vercel.app")) return "preview";
    return "other";
  };
  const forwarded = classify(req.headers.get("x-forwarded-host"));
  if (forwarded && forwarded !== "other") return forwarded;
  return classify(req.headers.get("host"));
}

/**
 * `$host` + `host` properties for server-side PostHog events so funnels can be
 * scoped to a site. Empty when the host cannot be determined.
 */
export function hostProps(req: { headers: { get(name: string): string | null } }): { $host?: string; host?: string } {
  const host = requestHost(req);
  return host ? { $host: host, host } : {};
}
