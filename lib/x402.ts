/**
 * lib/x402.ts — x402 payment protocol server configuration.
 *
 * Shared x402 resource server used by premium API routes. Protected routes
 * return HTTP 402 with payment requirements that AI agents fulfill
 * automatically via the x402 protocol.
 *
 * The wallet address is configured via the X402_WALLET_ADDRESS env var.
 * When unset, a placeholder address is used so the 402 response flow still
 * works for discovery/validation — payments to a placeholder address are
 * not collectable. Set X402_WALLET_ADDRESS in production before accepting
 * real payments.
 *
 * Network: Base Sepolia (eip155:84532) — a testnet suitable for agent
 * payment flows. Switch to eip155:8453 (Base mainnet) for production.
 *
 * Facilitator: https://facilitator.x402.org — the public x402 facilitator.
 */

import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL ?? "https://facilitator.x402.org";

const PAY_TO = process.env.X402_WALLET_ADDRESS ?? "0x0000000000000000000000000000000000000000";

const NETWORK = (process.env.X402_NETWORK ?? "eip155:84532") as `${string}:${string}`;

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const x402Server = new x402ResourceServer(facilitatorClient).register(
  NETWORK,
  new ExactEvmScheme(),
);

export const x402Config: {
  payTo: string;
  network: `${string}:${string}`;
  facilitatorUrl: string;
} = {
  payTo: PAY_TO,
  network: NETWORK,
  facilitatorUrl: FACILITATOR_URL,
};
