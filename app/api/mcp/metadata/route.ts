import {
  SIGRANK_STANDARD_IDENTITY,
  SIGRANK_STANDARD_URL,
  SIGRANK_STANDARD_VERSION,
} from "@/lib/mcp/standard";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      mcp_endpoint: "https://signalaf.com/api/mcp",
      mcp_discovery_url: "https://signalaf.com/.well-known/mcp.json",
      server: "SignalAF SigRank HTTP MCP",
      sigrank_standard: SIGRANK_STANDARD_VERSION,
      standard_status: SIGRANK_STANDARD_IDENTITY.status,
      standard_url: SIGRANK_STANDARD_IDENTITY.standard_url,
      schema_url: SIGRANK_STANDARD_IDENTITY.schema_url,
      reference_math: SIGRANK_STANDARD_IDENTITY.reference_math,
      reference_platform: SIGRANK_STANDARD_IDENTITY.reference_platform,
      reference_field: SIGRANK_STANDARD_IDENTITY.reference_field,
      instrument: SIGRANK_STANDARD_IDENTITY.instrument,
      core_telemetry: SIGRANK_STANDARD_IDENTITY.core_telemetry,
      core_metrics: SIGRANK_STANDARD_IDENTITY.core_metrics,
      compatibility_excludes: SIGRANK_STANDARD_IDENTITY.compatibility_excludes,
      privacy: SIGRANK_STANDARD_IDENTITY.privacy,
      standard_record_tool: "get_sigrank_standard_record",
      standard_resources: ["sigrank://standard", "sigrank://standard/schema"],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-SigRank-Standard": SIGRANK_STANDARD_VERSION,
        Link: `<${SIGRANK_STANDARD_URL}>; rel="describedby"`,
      },
    },
  );
}
