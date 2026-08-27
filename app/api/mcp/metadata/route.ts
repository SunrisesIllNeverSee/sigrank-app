export const dynamic = "force-static";

const STANDARD_VERSION = "sigrank/0.1-draft";

export function GET() {
  return Response.json(
    {
      mcp_endpoint: "https://signalaf.com/api/mcp",
      mcp_discovery_url: "https://signalaf.com/.well-known/mcp.json",
      server: "SignalAF SigRank HTTP MCP",
      sigrank_standard: STANDARD_VERSION,
      standard_status: "proposed_open_standard",
      standard_url: "https://signalaf.com/standard",
      schema_url:
        "https://signalaf.com/standard/sigrank-operator-record-v0.1.schema.json",
      reference_math: "@sigrank/cascade",
      reference_platform: "SignalAF",
      reference_field: "SignalAF Reference Field",
      instrument: "sigrank-mcp",
      core_telemetry: ["input", "output", "cache_write", "cache_read"],
      core_metrics: ["yield", "leverage", "velocity", "snr", "dev10x"],
      privacy:
        "Core SigRank measurements do not require prompt text, response text, source code, or repository contents.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-SigRank-Standard": STANDARD_VERSION,
        Link: '<https://signalaf.com/standard>; rel="describedby"',
      },
    },
  );
}
