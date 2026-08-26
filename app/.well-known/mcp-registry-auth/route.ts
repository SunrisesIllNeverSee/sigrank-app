/**
 * MCP Registry domain authentication proof.
 *
 * Serves the public key that authorizes publication to the
 * `com.signalaf/*` namespace in the official MCP Registry.
 *
 * The private key is stored outside this repository in a secure
 * owner-controlled location. Only the public proof is exposed here.
 *
 * Reference: https://modelcontextprotocol.io/registry/authentication
 */

export const revalidate = 3600;

export async function GET() {
  const proof = "v=MCPv1; k=ed25519; p=EEzU72gsfN3KuUYs2pJFAuliaCjSlkGy8sZkBEjUCEM=";

  return new Response(proof, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
