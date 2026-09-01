# SigRank × Vercel Marketplace Submission

Engineering surface is ready. This document is the provider-dashboard handoff for the external Vercel Marketplace review step.

## Listing

**Name:** SigRank

**Category:** AI / developer tools / observability & evaluation

**Tagline:** Measure the people and agents operating your AI stack.

**Short description:**
SigRank adds an operator-evaluation layer to AI projects. It turns privacy-preserving token telemetry into repeatable cascade metrics, field benchmarks, operator signatures, comparisons, and diagnostics. The remote MCP surface lets agents call SigRank natively over Streamable HTTP.

**Landing page:** https://signalaf.com/vercel

**Developer docs:** https://signalaf.com/developers

**MCP docs:** https://signalaf.com/mcp

**Canonical MCP endpoint:** https://signalaf.com/api/mcp

**MCP discovery:** https://signalaf.com/.well-known/mcp.json

**Privacy:** https://signalaf.com/privacy

**Terms:** https://signalaf.com/terms

**Support:** hello@signalaf.com

## Product behavior

The Vercel integration should expose the existing canonical remote MCP server. Do not reimplement cascade math or fork the remote tool definitions in a Vercel-specific service.

Canonical architecture:

```text
Vercel installation / Agent Tools
              ↓
https://signalaf.com/api/mcp
              ↓
canonical SigRank remote tools + benchmark data
```

For developers who want a project-owned endpoint instead of the canonical URL, the one-click Vercel relay is maintained in:

```text
sigrank-mcp/examples/vercel-remote-mcp
```

## Positioning

Vercel already measures application execution through logs, traces, analytics, and runtime observability. SigRank is complementary: it evaluates the human/operator and AI-workflow layer using token-cascade telemetry and comparative benchmarks.

Do not describe SigRank as measuring model intelligence, work quality, employee productivity, or business value. It measures observable operator token-processing patterns and comparative operating form.

## Marketplace review boundary

Vercel provider enrollment, integration creation, product/category selection, and public Marketplace approval occur in Vercel's provider/dashboard review flow. Those external records are not created by repository code.

Once Vercel assigns an integration/product slug or ID, add it to the deploy/install CTAs if Vercel requires an integration-specific install URL. The MCP engineering surface itself does not require another implementation pass.
