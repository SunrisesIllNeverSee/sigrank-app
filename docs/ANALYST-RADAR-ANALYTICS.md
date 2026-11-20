# Analyst connector analytics

Prepared 2026-11-20. Owner requested Plugins Radar tracking and tracker installation during this session. Production activation has not been verified.

## Scope

The exact-pinned `@pluginsradar/analytics` 0.2.0 package observes only the public Analyst endpoint `/api/plugins/sigrank/mcp` used by the published ChatGPT/Codex plugin. The original `/api/mcp` integration is unchanged. Other clients using the Analyst endpoint can appear in the same dataset; platform attribution relies on client-supplied metadata, not authenticated proof.

An unset server-side `RADAR_KEY` makes this integration inactive. Vercel preview deployments are always excluded. Never use a public/client environment-variable prefix for this credential. No credential value belongs in source, reports or logs.

## Data minimization

Both `captureArgs` and `captureLocation` are false. An additional outbound allowlist removes argument fingerprints (which the SDK otherwise computes even with value capture disabled), argument names, metadata key lists, organization IDs, raw client and user-agent strings, every location field, custom properties and resource URIs. Unknown tool names become `unknown_tool`.

Permitted events are initialization, tool listing and tool calls. Permitted fields are event ID, time, SDK version, platform, platform-provided pseudonymous user/conversation IDs, known tool name, status/error class/code, duration, response size, locale, protocol and server versions. Results and error text are not sent. Pseudonymous IDs are linkable identifiers, not anonymous data or an install count.

Post-response flushing uses Next.js `after()` so Vercel can finish sending queued events after the response, including streaming responses. Existing PostHog instrumentation remains in place. Radar network failures do not alter MCP tool results; failed delivery can leave gaps in analytics. The SDK retries network/5xx failures once, pauses after 429 and stops sending for the process lifetime after 401/403.

## Production activation checklist

1. Review and approve the code and data-handling notice, then authorize push/merge/deployment for this product repository.
2. Configure the Radar-issued credential as the server-side `RADAR_KEY` for the intended production deployment. Do not paste it into chat. No credential was obtained during preparation.
3. Verify a deployed `tools/list` still exposes exactly the existing published schemas and security metadata.
4. Invoke one read-only tool through ChatGPT and verify its result, then check Radar for the first event. Radar says usage aggregates update hourly; deployment success alone is not capture verification.
5. Check actual tool invocations separately from initialization/discovery events. Do not infer users from health checks or call totals, and do not combine Radar user counts with PostHog counts without validating their definitions.

Removing `RADAR_KEY` and redeploying disables capture. Preview deployments need no credential.

## Visibility baseline and configured monitoring

The 2026-11-20 read-only baseline is recorded separately in the local investigation report. Radar had zero tool-usage events, zero appearances in its 532 generic searches, a 55/100 listing score and a category-page position #550 of 680. Those metrics measure different things.

Three custom directory searches were saved: `AI operator leaderboard`, `AI usage benchmarks`, `token usage comparison`. Three custom recommendation questions were saved about public AI operator leaderboards, comparing operators using token usage benchmarks, and explaining input/output/cache patterns. First search results were scheduled approximately 40 minutes later; first question answers within a day. These custom searches do not change Radar's public generic-search score.

Keyword follow-up: assess `token telemetry`, `token usage` and `token count` alongside operator-leaderboard language. The public Analyst reads aggregate operator records; the separate local CLI measures tokens. Do not market the Analyst as a local tokenizer or automatic token counter. Evaluate a rotation of the limited custom search slots before changing the published title or tagline.

## Package review

Deptrust checked npm 0.2.0 against OSV and GitHub advisories and reported no known vulnerabilities. Its published source was inspected for transport compatibility, batching, redaction and failure behavior. This is not a comprehensive security audit. The optional legacy SDK peer was not installed; transport-hook behavior is exercised against the repository's existing MCP v2 server.

References: [Radar methodology](https://pluginsradar.com/methodology), [SDK package](https://www.npmjs.com/package/@pluginsradar/analytics), [Radar privacy](https://pluginsradar.com/privacy). The published privacy policy does not clearly distinguish retention for customer SDK events from Radar's own ChatGPT plugin logs; confirm that with Radar before making a specific retention promise.

## Local validation

2026-11-20: TypeScript check and scoped ESLint exited 0. Canonical suite reported 11 passed. Full API/unit suite under Node 22 reported 782 passed, 4 skipped, 0 failed. Three focused MCP test files under Node 22 reported 12 passed, including real SDK transport capture, outbound field exclusion, unmodified published schemas, refused-intake resilience, and missing-key/preview disable behavior. Network requests in the Radar integration tests were intercepted; no test events were sent to Radar. Production build and live capture remain unverified. Vitest emitted an existing config-loader compatibility warning for its CommonJS configuration.
