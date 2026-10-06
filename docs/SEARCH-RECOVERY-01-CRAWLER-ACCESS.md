# SEARCH-RECOVERY-01 — AI/Search Crawler Access Baseline (Addendum §K)

**Verified 2026-10-05** against production `signalaf.com`. AI-search discovery and Google organic are separate measurement channels — this records which crawlers are intentionally reachable.

## robots.txt policy (live)

| Agent | Rule | Intent |
|---|---|---|
| `GPTBot` | Allow `/` (disallow `/api/`, `/auth/`) | OpenAI training crawler — allowed |
| `OAI-SearchBot` | *(no explicit rule → wildcard `Allow /`)* | ChatGPT Search discovery crawler — **reachable via wildcard** ✓ |
| `PerplexityBot` | Allow `/` | Perplexity — explicitly allowed |
| `ClaudeBot` | Allow `/` | Anthropic — explicitly allowed |
| `CCBot` | Allow `/` | Common Crawl — allowed |
| `Google-Extended` | Allow `/` | Gemini grounding — explicitly allowed (intentional) |
| `Applebot-Extended` | Allow `/` | Apple Intelligence — allowed |
| `Bytespider`, `meta-externalagent` | Disallow `/` | ByteDance / Meta scrapers — intentionally blocked |
| `*` wildcard | Allow `/` + `/api/exchange/signals`; disallow `/api/`, `/auth/`, `/internal/`; `Crawl-delay: 10` | default policy |

## Live HTTP verification (real crawler UA → `/methodology`)

| UA | Result |
|---|---|
| `OAI-SearchBot` | **HTTP 200** — no WAF/JS challenge |
| `PerplexityBot` | **HTTP 200** |
| `ClaudeBot` | **HTTP 200** |
| `Googlebot` | **HTTP 200** |

No JS challenge/CAPTCHA/hard rate-limit encountered at edge for any search or AI crawler UA. `Crawl-delay: 10` is advisory (Google ignores it; Bing honors it).

## Notes

- `OAI-SearchBot` depends on the wildcard rule — correct for the intended-open policy, but worth an explicit `Allow` line if the policy ever gets enumerated.
- AI referral traffic must be tracked separately from Google organic (Phase 8 monitoring: PostHog referral dimension + the fixed AEO prompt panel — not this doc's scope).
- IndexNow (§J) covers Bing/Yandex/Seznam/Naver — ChatGPT Search is reached via Bing's index; Google is sitemap + GSC only.
