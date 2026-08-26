import "server-only";

/**
 * lib/exchange/signed-notification.ts — Authenticated BYO notification delivery.
 *
 * Spec §18.5: BYO notification deliveries must be authenticated using:
 * - exact-body signatures (HMAC-SHA256 over the canonical request body)
 * - sender and destination binding (signature covers source + target domain)
 * - timestamp (ISO 8601, ±5 minute replay window)
 * - nonce (unique per delivery, stored for replay detection)
 * - event ID (idempotency key — same event retried = same ID)
 * - replay window (5 minutes)
 * - idempotency behavior (same event_id + body = ack, not re-process)
 * - key rotation metadata (key_id in header)
 *
 * Receiving a notification must NOT make the sender's claims authoritative.
 * The recipient must load or verify canonical state independently.
 */

import { createHmac, createHash, randomUUID } from "node:crypto";
import { safeEqual } from "./server";

export interface SignedNotificationHeaders {
  "x-exchange-signature": string;
  "x-exchange-timestamp": string;
  "x-exchange-nonce": string;
  "x-exchange-event-id": string;
  "x-exchange-key-id": string;
  "x-exchange-source-domain": string;
  "x-exchange-destination-domain": string;
  "content-type": string;
  "user-agent": string;
}

export interface SignedNotificationResult {
  delivered: boolean;
  status?: number;
  reason?: string;
  event_id: string;
  nonce: string;
  signature: string;
}

/**
 * The signing key for outbound notifications.
 * Uses the exchange reference admin key or a dedicated notification key.
 * The key_id tells the recipient which key was used (for rotation).
 */
function getSigningKey(): { key: string; keyId: string } {
  const key = process.env.EXCHANGE_NOTIFICATION_SIGNING_KEY ?? process.env.EXCHANGE_REFERENCE_ADMIN_KEY ?? "";
  const keyId = process.env.EXCHANGE_NOTIFICATION_KEY_ID ?? "exchange-notification-v1";
  return { key, keyId };
}

/**
 * Compute the HMAC-SHA256 signature over the canonical notification string.
 *
 * Canonical string format:
 *   <timestamp>\n<nonce>\n<event_id>\n<source_domain>\n<dest_domain>\n<body_sha256>
 *
 * This binds the signature to time, uniqueness, event identity, sender,
 * recipient, and exact body content. Any alteration invalidates the signature.
 */
export function computeNotificationSignature(params: {
  timestamp: string;
  nonce: string;
  eventId: string;
  sourceDomain: string;
  destinationDomain: string;
  body: string;
}): string {
  const { key } = getSigningKey();
  const bodyHash = createHash("sha256").update(params.body).digest("hex");
  const canonical = [
    params.timestamp,
    params.nonce,
    params.eventId,
    params.sourceDomain,
    params.destinationDomain,
    bodyHash,
  ].join("\n");
  return `sha256=${createHmac("sha256", key).update(canonical).digest("hex")}`;
}

/**
 * Deliver a signed notification to a BYO domain agent endpoint.
 *
 * The notification includes:
 * - the event payload (in the body)
 * - signature headers (for recipient verification)
 * - replay protection (timestamp + nonce + event_id)
 *
 * The recipient MUST verify the signature, check the timestamp is within
 * the replay window, and track the nonce/event_id for idempotency.
 * The recipient MUST NOT treat the notification as authoritative state —
 * it must fetch canonical state from the exchange control plane.
 */
export async function deliverSignedNotification(params: {
  endpoint: string;
  sourceDomain: string;
  destinationDomain: string;
  event: Record<string, unknown>;
  eventId?: string;
}): Promise<SignedNotificationResult> {
  const { endpoint, sourceDomain, destinationDomain, event } = params;
  const { keyId } = getSigningKey();

  const eventId = params.eventId ?? randomUUID();
  const nonce = randomUUID();
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({
    protocol: "Contribution Exchange",
    version: "0.2",
    event_id: eventId,
    ...event,
  });

  const signature = computeNotificationSignature({
    timestamp,
    nonce,
    eventId,
    sourceDomain,
    destinationDomain,
    body,
  });

  const headers: Record<string, string> = {
    "x-exchange-signature": signature,
    "x-exchange-timestamp": timestamp,
    "x-exchange-nonce": nonce,
    "x-exchange-event-id": eventId,
    "x-exchange-key-id": keyId,
    "x-exchange-source-domain": sourceDomain,
    "x-exchange-destination-domain": destinationDomain,
    "content-type": "application/json",
    "user-agent": "Contribution-Exchange/0.2",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
    return {
      delivered: response.ok,
      status: response.status,
      event_id: eventId,
      nonce,
      signature,
    };
  } catch (error) {
    return {
      delivered: false,
      reason: error instanceof Error ? error.message : "delivery_failed",
      event_id: eventId,
      nonce,
      signature,
    };
  }
}

/**
 * Verify an inbound notification signature (for when this domain receives
 * notifications from another exchange operator).
 *
 * Returns true iff:
 * - the signature matches (constant-time comparison)
 * - the timestamp is within the replay window (±5 minutes)
 * - the source/destination domains match expectations
 *
 * The caller is responsible for nonce/event_id tracking (replay detection
 * and idempotency). This function only verifies cryptographic authenticity
 * and temporal validity.
 */
export function verifyNotificationSignature(params: {
  signature: string;
  timestamp: string;
  nonce: string;
  eventId: string;
  sourceDomain: string;
  destinationDomain: string;
  body: string;
  expectedSourceDomain?: string;
  expectedDestinationDomain?: string;
  replayWindowMs?: number;
  signingKey?: string;
}): { valid: boolean; reason?: string } {
  const replayWindowMs = params.replayWindowMs ?? 5 * 60 * 1000;

  // Check replay window
  const ts = new Date(params.timestamp).getTime();
  if (isNaN(ts)) return { valid: false, reason: "invalid_timestamp" };
  const age = Math.abs(Date.now() - ts);
  if (age > replayWindowMs) return { valid: false, reason: "timestamp_outside_replay_window" };

  // Check domain binding
  if (params.expectedSourceDomain && params.sourceDomain !== params.expectedSourceDomain) {
    return { valid: false, reason: "source_domain_mismatch" };
  }
  if (params.expectedDestinationDomain && params.destinationDomain !== params.expectedDestinationDomain) {
    return { valid: false, reason: "destination_domain_mismatch" };
  }

  // Verify signature
  const key = params.signingKey ?? process.env.EXCHANGE_NOTIFICATION_SIGNING_KEY ?? process.env.EXCHANGE_REFERENCE_ADMIN_KEY ?? "";
  if (!key) return { valid: false, reason: "no_signing_key_configured" };

  const bodyHash = createHash("sha256").update(params.body).digest("hex");
  const canonical = [
    params.timestamp,
    params.nonce,
    params.eventId,
    params.sourceDomain,
    params.destinationDomain,
    bodyHash,
  ].join("\n");
  const expected = `sha256=${createHmac("sha256", key).update(canonical).digest("hex")}`;

  // Constant-time comparison
  if (!safeEqual(params.signature, expected)) {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true };
}
