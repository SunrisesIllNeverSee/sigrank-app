/**
 * SSRF guard helpers for outbound Exchange fetches (agent endpoints, domain
 * discovery): name/IP checks, DNS validation, and pinnedExchangeFetch — a
 * request whose socket is pinned to the exact addresses that passed
 * validation, so a hostile resolver cannot rebind between check and connect.
 * Redirects are never followed automatically.
 */
import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { request as httpRequest } from "node:http";
import type { RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

function ipv4ToParts(ip: string): number[] | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return parts;
}

function isPrivateIpv4(ip: string): boolean {
  const p = ipv4ToParts(ip);
  if (!p) return true; // unparseable: treat as prohibited
  const [a, b] = p;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && p[2] === 0) return true; // 192.0.0.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

/** Expand an IPv6 literal into 8 16-bit groups, or null if malformed. */
function expandIpv6(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  // Embedded dotted IPv4 tail (e.g. ::ffff:127.0.0.1)
  const lastColon = s.lastIndexOf(":");
  if (s.includes(".") && lastColon !== -1) {
    const v4 = ipv4ToParts(s.slice(lastColon + 1));
    if (!v4) return null;
    s = `${s.slice(0, lastColon + 1)}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : fill < 0) return null;
  const groups = [...head, ...(halves.length === 2 ? Array(fill).fill("0") : []), ...tail].map((g) => parseInt(g, 16));
  if (groups.length !== 8 || groups.some((n) => !Number.isInteger(n) || n < 0 || n > 0xffff)) return null;
  return groups;
}

function isPrivateIpv6(ip: string): boolean {
  const g = expandIpv6(ip);
  if (!g) return true;
  if (g.every((x) => x === 0)) return true; // ::
  if (g.slice(0, 7).every((x) => x === 0) && g[7] === 1) return true; // ::1
  const embeddedV4 = `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  // IPv4-mapped ::ffff:0:0/96 and deprecated IPv4-compatible ::/96
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) return isPrivateIpv4(embeddedV4);
  // NAT64 64:ff9b::/96
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPrivateIpv4(embeddedV4);
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2002) return isPrivateIpv4(`${g[1] >> 8}.${g[1] & 255}.${g[2] >> 8}.${g[2] & 255}`); // 6to4
  return false;
}

/** True when the IP literal is loopback/private/link-local/CGNAT/unspecified/etc. */
export function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return true;
}

function stripHost(hostname: string): string {
  let h = hostname.trim().toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  if (h.endsWith(".")) h = h.slice(0, -1);
  return h;
}

/** Synchronous hostname check (names + IP literals). Does not resolve DNS. */
export function isProhibitedHostSync(hostname: string): boolean {
  const h = stripHost(hostname);
  if (!h) return true;
  if (isIP(h)) return isPrivateIp(h);
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "metadata.google.internal" || h.endsWith(".internal")) return true;
  return false;
}

export type HostResolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
export type ResolvedAddress = { address: string; family: number };

const defaultResolver: HostResolver = (h) => lookup(h, { all: true });

/**
 * Resolve a hostname and return its addresses only when every one is public —
 * null when the name is prohibited, unresolvable, or ANY address is private.
 * The returned list is the authoritative dial set for pinnedExchangeFetch.
 */
export async function resolveVerifiedAddresses(
  hostname: string,
  resolver: HostResolver = defaultResolver,
): Promise<ResolvedAddress[] | null> {
  if (isProhibitedHostSync(hostname)) return null;
  const h = stripHost(hostname);
  if (isIP(h)) return [{ address: h, family: isIP(h) }];
  try {
    const addrs = await resolver(h);
    if (!addrs || addrs.length === 0) return null;
    return addrs.some((a) => isPrivateIp(a.address)) ? null : addrs;
  } catch {
    return null;
  }
}

/**
 * Resolve a hostname and reject if it is prohibited by name or if ANY resolved
 * address is private/loopback/etc. Unresolvable hosts are rejected (fail closed).
 */
export async function isProhibitedHostResolved(
  hostname: string,
  resolver: HostResolver = defaultResolver,
): Promise<boolean> {
  return (await resolveVerifiedAddresses(hostname, resolver)) === null;
}

type PinnedLookup = (
  hostname: string,
  options: unknown,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) => void;

/**
 * A node:dns lookup-compatible function that answers only from a fixed,
 * pre-validated address list. It never consults DNS — that is the point:
 * the socket can only ever reach an address that already passed validation.
 */
export function pinnedLookup(addrs: ResolvedAddress[]): PinnedLookup {
  let idx = 0;
  return (_hostname, options, callback) => {
    if ((options as { all?: boolean } | null)?.all) {
      callback(null, addrs.map((a) => ({ address: a.address, family: a.family })));
      return;
    }
    const a = addrs[idx++ % addrs.length];
    callback(null, a.address, a.family);
  };
}

export interface PinnedFetchInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  signal?: AbortSignal;
  resolver?: HostResolver;
}

const MAX_RESPONSE_BODY = 1_048_576;

/**
 * fetch() for Exchange outbound calls: resolves + validates the destination
 * once, then dials with a pinned lookup so the socket can only reach an
 * address that passed validation (closes the check-to-connect DNS rebinding
 * window). TLS SNI and the Host header still use the real hostname. Redirects
 * are never followed — callers inspect and re-pin each hop themselves.
 */
export async function pinnedExchangeFetch(url: string, init: PinnedFetchInit = {}): Promise<Response> {
  const target = new URL(url);
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new Error(`SSRF guard: scheme ${target.protocol} is not allowed`);
  }
  const addrs = await resolveVerifiedAddresses(target.hostname, init.resolver ?? defaultResolver);
  if (!addrs) throw new Error(`SSRF guard: ${target.hostname} is prohibited or unresolvable`);
  const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
  return new Promise<Response>((resolve, reject) => {
    const req = transport(
      target,
      { method: init.method ?? "GET", headers: init.headers, lookup: pinnedLookup(addrs) as unknown as RequestOptions["lookup"] },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BODY) {
            req.destroy(new Error("SSRF guard: response exceeds 1MB limit"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          try {
            const headers = new Headers();
            for (let i = 0; i < res.rawHeaders.length; i += 2) headers.append(res.rawHeaders[i], res.rawHeaders[i + 1]);
            const status = res.statusCode ?? 0;
            const nullBody = status === 204 || status === 304 || (status >= 300 && status < 400);
            resolve(new Response(nullBody ? null : Buffer.concat(chunks), { status, statusText: res.statusMessage ?? "", headers }));
          } catch (e) {
            reject(e);
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    const signal = init.signal;
    if (signal) {
      const abort = () => req.destroy(signal.reason instanceof Error ? signal.reason : new Error("request aborted"));
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    }
    if (init.body != null) req.write(init.body);
    req.end();
  });
}
