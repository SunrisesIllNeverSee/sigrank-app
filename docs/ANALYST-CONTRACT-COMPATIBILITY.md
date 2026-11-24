# Analyst published-contract compatibility

The existing `/api/plugins/sigrank/mcp` URL serves contract 1.2.0. Keep that
contract stable for clients that cached `tools/list`. A plugin package version,
MCP server version and MCP protocol version are separate identifiers.

## Why this guard exists

The 1.1.0 → 1.2.0 rollout changed strict output schemas at the same URL. A client
retaining the 1.1.0 schemas rejects successful 1.2.0 responses: its version is a
JSON Schema `const`, and new properties violate closed object schemas. Testing
only against the latest schema did not detect that installed-client failure.

`__tests__/fixtures/analyst/published-1.2.0.json` is an independent release
baseline. Do not regenerate it with the working contracts. The ordinary Node CI
suite checks that existing tools retain their input/output schemas, defaults,
security schemes and annotations. Field-feature execution tests also validate
actual success responses against the baseline. New tool names and descriptive
copy changes can be added without changing old definitions.

## Future changes

Keep existing tools at this URL on 1.2.0. For a breaking change, introduce a
separate versioned route or distinct versioned tool names and keep the prior
handler available. Preserve its validation and documented semantics. Update the
intended client registration deliberately; verify both an already-connected
client and a fresh connection before release. Do not bump the shared version
constant in place, infer expected versions from user-agent strings, or relabel
new data as an old contract. An input-default or null/eligibility semantic
change also needs review even if its JSON type is unchanged.

## Recovering a previously affected client

Refresh/reconnect the affected host's Analyst connector, then retry
`get_leaderboard`, `get_field_stats`, `get_operator` and `compare_operators`
in a fresh session. Confirm the fetched output schemas and response both use
1.2.0. A current direct HTTP success or a working OpenAI connection does not
prove that a separate Claude connection refreshed successfully. Do not interrupt
another active session or remove the integration as an automatic repair.

This guard prevents another in-place contract drift; it does not remotely
invalidate a host's existing 1.1.0 cache. The old affected connection must refresh.
