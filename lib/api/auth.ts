import "server-only";

/**
 * lib/api/auth.ts — the "authenticated write" helper for v1 write endpoints.
 *
 * Two trust paths, one gate:
 *
 *   1. SIGNATURE path (CLI / agent callers): the caller sends an ed25519
 *      signature over the request body's canonical bytes via the
 *      `x-agent-signature` header, plus a `device_id` in the body. The helper
 *      loads the device's registered public key and verifies the signature
 *      using the SAME canonicalizer as /snapshots (lib/ingest/canonical.mjs).
 *      Identity is resolved FROM THE DEVICE (operator_id on the devices row),
 *      never from a body-supplied codename.
 *
 *   2. SESSION path (web UI callers): the caller has a Supabase auth cookie.
 *      The helper resolves the verified user via getUser() and their linked
 *      operator via operator_accounts — the same getSessionOperator() flow
 *      used by /me and /settings.
 *
 * The helper accepts EITHER a valid signature OR a valid session, and rejects
 * everything else with a 401. Routes call `resolveAuth(req, body)` and use the
 * returned `operatorId` / `codename` instead of trusting a body-supplied
 * `operator_codename`.
 *
 * DO NOT introduce a second canonicalizer — the canon-parity test
 * (__tests__/ingest/canon_parity.test.mjs) pins the agent↔server byte contract.
 * This helper reuses lib/ingest/canonical.mjs, the single source of truth.
 */

import type { NextRequest } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import {
  getSessionOperator,
  type SessionOperator,
} from "@/lib/supabase/auth-server";
import { verifySignature } from "@/lib/ingest/signature";

export interface AuthResult {
  /** Which trust path succeeded. */
  method: "signature" | "session";
  /** The verified operator UUID — use this for all DB writes. */
  operatorId: string;
  /** The operator's codename (for response handles / logging). */
  codename: string;
  /** The device_id when auth was via signature (null for session). */
  deviceId: string | null;
  /** The full session operator when auth was via session (null for signature). */
  session: SessionOperator | null;
}

export interface AuthReject {
  ok: false;
  status: 401;
  body: { error: string; reason: string; detail?: string };
}

export interface AuthSuccess extends AuthResult {
  ok: true;
}

/**
 * Resolve the caller's identity from EITHER an ed25519 signature OR a Supabase
 * session. Returns `{ ok: true, ... }` on success or `{ ok: false, status, body }`
 * on failure (the caller spreads the status + body into a NextResponse.json).
 *
 * @param req    The NextRequest (for header + cookie access).
 * @param body   The parsed JSON body (used for signature verification over
 *               canonical bytes, and for reading `device_id` on the signature
 *               path). Must be a plain object.
 */
export async function resolveAuth(
  req: NextRequest,
  body: Record<string, unknown>,
): Promise<AuthSuccess | AuthReject> {
  // ── Path 1: signature ──────────────────────────────────────────────────
  const signature = req.headers.get("x-agent-signature");
  if (signature) {
    const deviceId = typeof body.device_id === "string" ? body.device_id : "";
    if (!deviceId) {
      return reject(
        "signature_invalid",
        "device_id required for signature auth",
      );
    }
    const svc = getSupabaseService();
    if (!svc) {
      return reject("service_unavailable", "Service role not configured");
    }
    // Load the device row + its operator codename.
    const { data, error } = await svc
      .from("devices")
      .select(
        "device_id, operator_id, agent_public_key, trust_status, operators:operator_id(codename)",
      )
      .eq("device_id", deviceId)
      .maybeSingle();
    if (error || !data) {
      return reject("signature_invalid", "Device not found or revoked");
    }
    const device = data as {
      device_id: string;
      operator_id: string;
      agent_public_key: string;
      trust_status: string;
      operators: unknown;
    };
    if (device.trust_status !== "trusted") {
      return reject(
        "signature_invalid",
        `Device trust_status=${device.trust_status}`,
      );
    }
    // Verify the ed25519 signature over the body's canonical bytes.
    const valid = verifySignature(body, signature, device.agent_public_key);
    if (!valid) {
      return reject("signature_invalid", "Signature verification failed");
    }
    const codename = embeddedCodename(device.operators);
    return {
      ok: true,
      method: "signature",
      operatorId: device.operator_id,
      codename: codename ?? "",
      deviceId: device.device_id,
      session: null,
    };
  }

  // ── Path 2: session ────────────────────────────────────────────────────
  const session = await getSessionOperator();
  if (session) {
    return {
      ok: true,
      method: "session",
      operatorId: session.operatorId,
      codename: session.codename,
      deviceId: null,
      session,
    };
  }

  // ── Neither path succeeded ─────────────────────────────────────────────
  return reject("unauthorized", "No valid signature or session");
}

/** Reject helper — builds the standard 401 shape. */
function reject(reason: string, detail: string): AuthReject {
  return {
    ok: false,
    status: 401,
    body: { error: "unauthorized", reason, detail },
  };
}

/** Normalize a supabase to-one embed (object) vs to-many (array) to the codename. */
function embeddedCodename(operators: unknown): string | null {
  if (Array.isArray(operators))
    return (operators[0] as { codename?: string })?.codename ?? null;
  return (operators as { codename?: string } | null)?.codename ?? null;
}

/**
 * Resolve the caller's identity from a Supabase session ONLY (no signature path).
 * Used by endpoints that are web-UI-only (e.g. ingest-paste, checkout).
 */
export async function requireSession(): Promise<
  { ok: true; session: SessionOperator } | AuthReject
> {
  const session = await getSessionOperator();
  if (session) return { ok: true, session };
  return reject("unauthorized", "Sign-in required");
}
