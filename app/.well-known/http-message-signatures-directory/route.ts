/**
 * app/.well-known/http-message-signatures-directory/route.ts
 *
 * Web Bot Auth — serves a JWKS so other sites can verify requests
 * signed by SigRank's bot/agent.
 *
 * Per the IETF WebBotAuth WG, sites publishing this directory allow
 * receiving sites to verify the signature on bot requests via the
 * Signature-Agent and Signature-Input headers.
 */

import { NextResponse } from "next/server";

export const revalidate = 86400; // 24h

export async function GET() {
  const jwks = {
    keys: [
      {
        kty: "OKP",
        crv: "Ed25519",
        kid: "sigrank-bot-1",
        use: "sig",
        alg: "EdDSA",
        x: "763vplJOjVqStqCMx--76EUcKEGtom0MsYACSmpOqVQ",
      },
    ],
  };

  return NextResponse.json(jwks, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
