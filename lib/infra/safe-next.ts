export function safeNext(raw: string | null | undefined, origin = "https://signalaf.invalid"): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") ||
      Array.from(raw).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) return null;
  try {
    const base = new URL(origin);
    const target = new URL(raw, base);
    return target.origin === base.origin && !target.pathname.startsWith("//")
      ? `${target.pathname}${target.search}${target.hash}` : null;
  } catch {
    return null;
  }
}
