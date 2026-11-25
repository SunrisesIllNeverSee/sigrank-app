/**
 * MCP Registry domain authentication proof.
 *
 * Serves the public key that authorizes publication to the
 * `com.signalaf/*` namespace in the official MCP Registry.
 *
 * The private key is the MCP_REGISTRY_PRIVATE_KEY repository secret, used
 * only by .github/workflows/mcp-registry-publish.yml. Only the public proof
 * is exposed here. Rotated 2026-11-25.
 *
 * Reference: https://modelcontextprotocol.io/registry/authentication
 */

export const revalidate = 3600;

export async function GET() {
  const proof = "v=MCPv1; k=ed25519; p=alOrs6cp/ca2Z82YK6ApSY0wWS4n4xJFIMtcUePjsFE=";

  return new Response(proof, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
