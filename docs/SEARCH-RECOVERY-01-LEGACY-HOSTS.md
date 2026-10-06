# SEARCH-RECOVERY-01 — Legacy Host Cleanup Manifest (Addendum §H / Phase 3)

**Verified 2026-10-05** — DNS + HTTP probed for all three legacy hosts.

## DNS/HTTP state

| Host | DNS | HTTP(S) | State |
|---|---|---|---|
| `sigarena.signalaf.com` | does not resolve | unreachable (HTTP 000) | **dead — nothing serving** |
| `signaaf.com` | does not resolve | unreachable (HTTP 000) | **dead** |
| `www.signaaf.com` | does not resolve | unreachable (HTTP 000) | **dead** |

No live redirects are required today — the hosts serve nothing at all. The risk is purely *if* DNS is ever re-pointed (or if stale external links/domains resurface): this manifest is the standing rule.

## Redirect policy (when/if a host is re-pointed)

**Rule:** permanent route-preserving redirect ONLY where a true semantic equivalent exists; otherwise return `410 Gone` (preferred) or 404. Never blanket-redirect to `/`.

| Legacy pattern | SignalAF equivalent | Action |
|---|---|---|
| `sigarena.signalaf.com/operator/<x>` | `signalaf.com/user/<x>` — iff operator exists | 301; else 410 |
| `sigarena.signalaf.com/compare` | `signalaf.com/compare` | 301 |
| `sigarena.signalaf.com/vs/<x>` | `signalaf.com/vs/<x>` — iff that comparison exists | 301; else 410 |
| `sigarena.signalaf.com/board*` | `signalaf.com/board/all` | 301 |
| `sigarena.signalaf.com/hall` | `signalaf.com/hall` | 301 |
| any other `sigarena/*` path | no equivalent | 410 |
| `signaaf.com/*`, `www.signaaf.com/*` | project retired; no equivalent | 410 (do NOT point at signalaf.com) |

## Implementation note

If DNS is re-pointed, implement as a host-aware middleware/edge redirect keyed on the mapping above — do not add per-path app routes. Until then, no code change is warranted (nothing resolves; adding redirects now changes zero requests).
