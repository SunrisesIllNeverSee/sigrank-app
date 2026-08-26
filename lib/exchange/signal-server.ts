import "server-only";

/**
 * lib/exchange/signal-server.ts — Server-side ExchangeSignal operations.
 *
 * Handles signal CRUD, revision management, discovery, and the invariant
 * that no signal action can advance Contribution Exchange state.
 */

import { getExchangeAdmin, normalizeDomain } from "./server";
import { computeRevisionHash, generateSignalId, generateAttemptId, generateVerificationId, generateQualificationId } from "@/exchange-gateway/src/signal-revision";
import { type ExchangeSignalInput } from "@/exchange-gateway/src/signal-schema";
import type { ExchangeSignal, SignalStatus, SignalType } from "@/exchange-gateway/src/signal-types";

const admin = () => getExchangeAdmin();

// ─── Signal status transitions (§6.3) ────────────────────────────────────────

const VALID_TRANSITIONS: Record<SignalStatus, SignalStatus[]> = {
  draft: ["published"],
  published: ["paused", "closed", "expired", "withdrawn"],
  paused: ["published", "closed", "expired", "withdrawn"],
  closed: [],
  expired: [],
  withdrawn: [],
};

export function isValidTransition(from: SignalStatus, to: SignalStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Create a new signal (draft) ─────────────────────────────────────────────

export async function createSignal(input: {
  publisherDomain: string;
  stewardDomain: string;
  signal: ExchangeSignalInput;
  keyId: string;
}): Promise<{ signal_id: string; revision: number; status: SignalStatus }> {
  const db = admin();
  const signalId = input.signal.signal_id ?? generateSignalId();
  const normalizedDomain = normalizeDomain(input.publisherDomain);
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com"}/api/exchange/signals/${signalId}`;

  // Insert signal row (draft status — no revision is created until publish)
  const { error: signalError } = await db.from("exchange_signals").insert({
    id: signalId,
    publisher_domain: normalizedDomain,
    steward_domain: normalizeDomain(input.stewardDomain),
    type: input.signal.type,
    status: "draft",
    current_revision: 0,
    canonical_url: canonicalUrl,
    visibility: input.signal.participation.visibility,
    challenge_kind: input.signal.challenge_kind ?? null,
    title: input.signal.title,
    summary: input.signal.summary,
    labels: input.signal.labels ?? [],
  });

  if (signalError) throw signalError;

  return { signal_id: signalId, revision: 0, status: "draft" };
}

// ─── Publish a signal (creates immutable revision) ───────────────────────────

export async function publishSignal(input: {
  signalId: string;
  signal: ExchangeSignalInput;
  publisherDomain: string;
  stewardDomain: string;
  keyId: string;
  signature?: string;
}): Promise<{ signal_id: string; revision: number; revision_hash: string; canonical_url: string }> {
  const db = admin();
  const normalizedDomain = normalizeDomain(input.publisherDomain);

  // Get current signal state
  const { data: existing, error: fetchError } = await db.from("exchange_signals")
    .select("*")
    .eq("id", input.signalId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Signal not found");
  if (existing.publisher_domain !== normalizedDomain) {
    throw new Error("Not authorized: publisher domain mismatch");
  }
  if (!isValidTransition(existing.status, "published")) {
    throw new Error(`Cannot publish from status ${existing.status}`);
  }

  const revision = (existing.current_revision ?? 0) + 1;
  const canonicalUrl = existing.canonical_url;
  const now = new Date().toISOString();

  // Build the full signal document
  const signalDoc = {
    ...input.signal,
    signal_id: input.signalId,
    revision,
    canonical_url: canonicalUrl,
    publisher: {
      domain: normalizedDomain,
      steward: normalizeDomain(input.stewardDomain),
      issuer_id: `domain:${normalizedDomain}`,
      authentication_profile: {
        method: "existing_exchange_authentication",
        key_id: input.keyId,
      },
    },
    status: "published" as SignalStatus,
    timestamps: {
      ...input.signal.timestamps,
      published_at: now,
    },
  };

  const revisionHash = computeRevisionHash(signalDoc);

  // Insert immutable revision
  const { error: revError } = await db.from("exchange_signal_revisions").insert({
    signal_id: input.signalId,
    revision,
    canonical_document: signalDoc,
    revision_hash: revisionHash,
    publisher_key_id: input.keyId,
    publisher_signature: input.signature ?? null,
    published_at: now,
    accepts_attempts_until: input.signal.timestamps.accepts_attempts_until ?? null,
    expires_at: input.signal.timestamps.expires_at ?? null,
  });
  if (revError) throw revError;

  // Update signal current state
  const { error: updateError } = await db.from("exchange_signals").update({
    status: "published",
    current_revision: revision,
    updated_at: now,
    // Mirror mutable fields from the revision so the collection endpoint
    // can filter without joining to exchange_signal_revisions.
    // published_at is set on first publish (revision 1) and preserved
    // across subsequent revisions (see createRevision).
    published_at: now,
    expires_at: input.signal.timestamps.expires_at ?? null,
    accepts_attempts_until: input.signal.timestamps.accepts_attempts_until ?? null,
    verification_mode: input.signal.verification.mode,
    consideration_mode: input.signal.consideration.mode,
  }).eq("id", input.signalId);
  if (updateError) throw updateError;

  // Record lineage
  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    signal_revision_hash: revisionHash,
    event_type: "signal_published",
    payload: { revision, publisher: normalizedDomain },
  });

  return { signal_id: input.signalId, revision, revision_hash: revisionHash, canonical_url: canonicalUrl };
}

// ─── Create a new revision of an already-published signal (§3.3) ─────────────
//
// Spec §3.3: "Material changes to requirements, verification, constraints,
// eligibility, or advertised consideration require a new immutable revision.
// Existing attempts continue to reference the revision under which they began."
//
// Unlike publishSignal, this does NOT require a status transition. The signal
// stays in its current status (typically "published"). This is the path PATCH
// uses for published/paused signals that need a material edit.

export async function createRevision(input: {
  signalId: string;
  signal: ExchangeSignalInput;
  publisherDomain: string;
  stewardDomain: string;
  keyId: string;
  signature?: string;
}): Promise<{ signal_id: string; revision: number; revision_hash: string; canonical_url: string }> {
  const db = admin();
  const normalizedDomain = normalizeDomain(input.publisherDomain);

  const { data: existing, error: fetchError } = await db.from("exchange_signals")
    .select("*")
    .eq("id", input.signalId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Signal not found");
  if (existing.publisher_domain !== normalizedDomain) {
    throw new Error("Not authorized: publisher domain mismatch");
  }
  // Revisions can only be added to signals that have been published at least
  // once (current_revision > 0). Drafts must use publishSignal.
  if (existing.current_revision === 0) {
    throw new Error("Cannot create a revision on a signal that has not been published");
  }
  // Terminal states (closed/withdrawn) cannot receive new revisions.
  if (["closed", "withdrawn"].includes(existing.status)) {
    throw new Error(`Cannot create a revision on a signal in status ${existing.status}`);
  }

  const revision = (existing.current_revision ?? 0) + 1;
  const canonicalUrl = existing.canonical_url;
  const now = new Date().toISOString();

  // Preserve the original published_at from the first revision so the
  // revision history is accurate. The new revision gets its own created_at
  // via the table default.
  const { data: firstRevision } = await db.from("exchange_signal_revisions")
    .select("published_at")
    .eq("signal_id", input.signalId)
    .eq("revision", 1)
    .maybeSingle();
  const originalPublishedAt = firstRevision?.published_at ?? now;

  // Build the full signal document. The status stays as the current status
  // (published or paused) — only the content changes via the new revision.
  const signalDoc = {
    ...input.signal,
    signal_id: input.signalId,
    revision,
    canonical_url: canonicalUrl,
    publisher: {
      domain: normalizedDomain,
      steward: normalizeDomain(input.stewardDomain),
      issuer_id: `domain:${normalizedDomain}`,
      authentication_profile: {
        method: "existing_exchange_authentication",
        key_id: input.keyId,
      },
    },
    status: existing.status as SignalStatus,
    timestamps: {
      ...input.signal.timestamps,
      created_at: originalPublishedAt,
      published_at: originalPublishedAt,
    },
  };

  const revisionHash = computeRevisionHash(signalDoc);

  // Insert immutable revision
  const { error: revError } = await db.from("exchange_signal_revisions").insert({
    signal_id: input.signalId,
    revision,
    canonical_document: signalDoc,
    revision_hash: revisionHash,
    publisher_key_id: input.keyId,
    publisher_signature: input.signature ?? null,
    published_at: now,
    accepts_attempts_until: input.signal.timestamps.accepts_attempts_until ?? null,
    expires_at: input.signal.timestamps.expires_at ?? null,
  });
  if (revError) throw revError;

  // Update signal current state — keep status, bump revision
  const { error: updateError } = await db.from("exchange_signals").update({
    current_revision: revision,
    updated_at: now,
    // Mirror mutable fields so the signals table stays useful for filtering
    // without joining to revisions. published_at is intentionally NOT
    // updated here — it preserves the original publication date from
    // revision 1 (set in publishSignal) so published_after filtering
    // reflects when the signal first went live, not when it was last edited.
    title: input.signal.title,
    summary: input.signal.summary,
    labels: input.signal.labels ?? [],
    challenge_kind: input.signal.challenge_kind ?? null,
    visibility: input.signal.participation.visibility,
    expires_at: input.signal.timestamps.expires_at ?? null,
    accepts_attempts_until: input.signal.timestamps.accepts_attempts_until ?? null,
    verification_mode: input.signal.verification.mode,
    consideration_mode: input.signal.consideration.mode,
  }).eq("id", input.signalId);
  if (updateError) throw updateError;

  // Record lineage
  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    signal_revision_hash: revisionHash,
    event_type: "signal_revision_created",
    payload: { revision, from_revision: existing.current_revision, publisher: normalizedDomain },
  });

  return { signal_id: input.signalId, revision, revision_hash: revisionHash, canonical_url: canonicalUrl };
}

// ─── Transition signal status (pause/close/withdraw) ─────────────────────────

export async function transitionSignalStatus(input: {
  signalId: string;
  toStatus: SignalStatus;
  publisherDomain: string;
  keyId: string;
}): Promise<{ signal_id: string; status: SignalStatus }> {
  const db = admin();
  const normalizedDomain = normalizeDomain(input.publisherDomain);

  const { data: existing, error } = await db.from("exchange_signals")
    .select("*")
    .eq("id", input.signalId)
    .maybeSingle();
  if (error) throw error;
  if (!existing) throw new Error("Signal not found");
  if (existing.publisher_domain !== normalizedDomain) {
    throw new Error("Not authorized: publisher domain mismatch");
  }
  if (!isValidTransition(existing.status as SignalStatus, input.toStatus)) {
    throw new Error(`Cannot transition from ${existing.status} to ${input.toStatus}`);
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: input.toStatus,
    updated_at: now,
  };
  if (["closed", "withdrawn"].includes(input.toStatus)) {
    update.closed_at = now;
  }

  const { error: updateError } = await db.from("exchange_signals").update(update).eq("id", input.signalId);
  if (updateError) throw updateError;

  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    event_type: `signal_${input.toStatus}`,
    payload: { from: existing.status, to: input.toStatus, publisher: normalizedDomain },
  });

  return { signal_id: input.signalId, status: input.toStatus };
}

// ─── Get a single signal (current published revision) ────────────────────────

export async function getSignal(signalId: string): Promise<ExchangeSignal | null> {
  const db = admin();
  const { data: signal, error } = await db.from("exchange_signals")
    .select("*")
    .eq("id", signalId)
    .maybeSingle();
  if (error || !signal) return null;

  // Get the current published revision
  const { data: revision, error: revError } = await db.from("exchange_signal_revisions")
    .select("*")
    .eq("signal_id", signalId)
    .eq("revision", signal.current_revision)
    .maybeSingle();
  if (revError || !revision) return null;

  return revision.canonical_document as ExchangeSignal;
}

// ─── Get signal metadata row (works for drafts) ──────────────────────────────
//
// Unlike getSignal(), which returns null for drafts (no revision 0 exists),
// this returns the raw exchange_signals row including status. Used by the
// PATCH route to decide between publishSignal (draft → published) and
// createRevision (published/paused → new revision).

export async function getSignalMeta(signalId: string): Promise<{ status: SignalStatus; current_revision: number } | null> {
  const db = admin();
  const { data, error } = await db.from("exchange_signals")
    .select("status, current_revision")
    .eq("id", signalId)
    .maybeSingle();
  if (error || !data) return null;
  return { status: data.status as SignalStatus, current_revision: data.current_revision as number };
}

// ─── List signals with filters (§10.1) ───────────────────────────────────────

export interface SignalListFilters {
  domain?: string;
  type?: SignalType;
  status?: SignalStatus;
  label?: string;
  verification_mode?: string;
  consideration_mode?: string;
  accepting_attempts?: boolean;
  published_after?: string;
  expires_before?: string;
  cursor?: string;
  limit?: number;
}

export async function listSignals(filters: SignalListFilters): Promise<{
  signals: ExchangeSignal[];
  next_cursor: string | null;
}> {
  const db = admin();
  const limit = Math.min(filters.limit ?? 50, 100);

  let query = db.from("exchange_signals").select("*").order("created_at", { ascending: false }).limit(limit + 1);

  // Only show published/paused/closed/expired/withdrawn to public
  // (drafts are private to the publisher)
  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.in("status", ["published", "paused", "closed", "expired", "withdrawn"]);
  }

  if (filters.domain) query = query.eq("publisher_domain", normalizeDomain(filters.domain));
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.label) query = query.contains("labels", [filters.label]);
  if (filters.verification_mode) query = query.eq("verification_mode", filters.verification_mode);
  if (filters.consideration_mode) query = query.eq("consideration_mode", filters.consideration_mode);
  // published_after filters by the signal's publication date (mirrored
  // from revision 1's published_at), NOT by created_at (draft creation).
  // A signal drafted Monday and published Tuesday must be returned by
  // published_after=Tuesday.
  if (filters.published_after) query = query.gte("published_at", filters.published_after);
  // expires_before filters by the signal's expiration date (mirrored from
  // the current revision), NOT by created_at. This returns signals that
  // expire before the given timestamp.
  if (filters.expires_before) query = query.lte("expires_at", filters.expires_before);
  // accepting_attempts is applied in SQL (before pagination) so the cursor
  // is computed over the filtered set. This prevents pagination from
  // skipping signals that were filtered out post-fetch. A signal is
  // "accepting attempts" when: status is published, expires_at is in the
  // future (or null), AND accepts_attempts_until is in the future (or null).
  // This matches the per-signal isAcceptingAttempts() check.
  if (filters.accepting_attempts) {
    const nowIso = new Date().toISOString();
    query = query
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .or(`accepts_attempts_until.is.null,accepts_attempts_until.gt.${nowIso}`);
  }
  if (filters.cursor) query = query.lt("created_at", filters.cursor);

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows) return { signals: [], next_cursor: null };

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? pageRows[pageRows.length - 1].created_at : null;

  // Fetch the current revision for each signal
  const signalIds = pageRows.map((r: { id: string }) => r.id);
  if (signalIds.length === 0) return { signals: [], next_cursor: null };

  const { data: revisions, error: revError } = await db.from("exchange_signal_revisions")
    .select("signal_id, revision, canonical_document")
    .in("signal_id", signalIds)
    .order("revision", { ascending: false });

  if (revError) throw revError;

  // Map signal_id → latest revision document
  const latestBySignal = new Map<string, ExchangeSignal>();
  for (const rev of revisions ?? []) {
    if (!latestBySignal.has(rev.signal_id)) {
      latestBySignal.set(rev.signal_id, rev.canonical_document as ExchangeSignal);
    }
  }

  const signals = pageRows
    .map((r: { id: string }) => latestBySignal.get(r.id))
    .filter((s): s is ExchangeSignal => s !== undefined);

  return { signals, next_cursor: nextCursor };
}

// ─── Check if a signal is accepting attempts ─────────────────────────────────

export async function isAcceptingAttempts(signalId: string): Promise<boolean> {
  const db = admin();
  const { data: signal, error } = await db.from("exchange_signals")
    .select("status, current_revision")
    .eq("id", signalId)
    .maybeSingle();
  if (error || !signal) return false;
  if (signal.status !== "published") return false;

  const { data: rev } = await db.from("exchange_signal_revisions")
    .select("accepts_attempts_until, expires_at")
    .eq("signal_id", signalId)
    .eq("revision", signal.current_revision)
    .maybeSingle();
  if (!rev) return false;

  const now = new Date();
  if (rev.accepts_attempts_until && new Date(rev.accepts_attempts_until) < now) return false;
  if (rev.expires_at && new Date(rev.expires_at) < now) return false;
  return true;
}

// ─── Count active attempts for an actor ──────────────────────────────────────
//
// Spec §12.6: "inconclusive and verifier_error must not count against
// an actor's attempt limit unless the failure was caused by a malformed
// or prohibited submission." We exclude both unconditionally — the
// "unless" clause requires case-by-case judgment that the first release
// does not attempt to automate. An actor whose attempt got an
// inconclusive result or a verifier infrastructure failure is not
// penalized and may retry.
//
// withdrawn attempts also do not count (the actor abandoned them).

export async function countActorAttempts(signalId: string, actorId: string): Promise<number> {
  const db = admin();
  const { count, error } = await db.from("signal_attempts")
    .select("*", { count: "exact", head: true })
    .eq("signal_id", signalId)
    .eq("actor_id", actorId)
    .neq("status", "withdrawn")
    .neq("status", "inconclusive")
    .neq("status", "verifier_error");
  if (error) throw error;
  return count ?? 0;
}

// ─── Count concurrent (in-flight) attempts for an actor ──────────────────────
//
// Spec §6.1 / §10.2: concurrent_attempts_per_actor limits how many attempts
// an actor can have in an active (non-terminal) status at once. Active
// statuses are: created, submitted, verification_pending. Terminal statuses
// (verified, rejected, inconclusive, withdrawn, expired) do not count
// toward the concurrent limit.

export async function countConcurrentAttempts(signalId: string, actorId: string): Promise<number> {
  const db = admin();
  const { count, error } = await db.from("signal_attempts")
    .select("*", { count: "exact", head: true })
    .eq("signal_id", signalId)
    .eq("actor_id", actorId)
    .in("status", ["created", "submitted", "verification_pending"]);
  if (error) throw error;
  return count ?? 0;
}

// ─── Create an attempt (§10.2) ───────────────────────────────────────────────

export async function createAttempt(input: {
  signalId: string;
  actorId: string;
  actorKeyId: string;
  idempotencyKey: string;
  requestHash: string;
  declarations: Record<string, unknown>;
}): Promise<{ attempt_id: string; signal_revision: number; signal_revision_hash: string; status: string; idempotent_replay: boolean }> {
  const db = admin();

  // Get the current published revision
  const { data: signal, error: sigError } = await db.from("exchange_signals")
    .select("status, current_revision")
    .eq("id", input.signalId)
    .maybeSingle();
  if (sigError) throw sigError;
  if (!signal) throw new Error("Signal not found");
  if (signal.status !== "published") throw new Error("Signal is not accepting attempts");

  const { data: revision, error: revError } = await db.from("exchange_signal_revisions")
    .select("revision, revision_hash, accepts_attempts_until, expires_at")
    .eq("signal_id", input.signalId)
    .eq("revision", signal.current_revision)
    .maybeSingle();
  if (revError || !revision) throw new Error("Signal revision not found");

  const now = new Date();
  if (revision.accepts_attempts_until && new Date(revision.accepts_attempts_until) < now) {
    throw new Error("Signal is no longer accepting attempts");
  }
  if (revision.expires_at && new Date(revision.expires_at) < now) {
    throw new Error("Signal has expired");
  }

  // Check idempotency: same key + same request_hash = return existing.
  // This is a check-then-insert pattern. To handle concurrent duplicates
  // safely, we catch the 23505 unique violation on insert and re-read the
  // existing row (same pattern as the execution receipt route).
  const { data: existing } = await db.from("signal_attempts")
    .select("*")
    .eq("signal_id", input.signalId)
    .eq("actor_id", input.actorId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    if (existing.request_hash !== input.requestHash) {
      throw new Error("Idempotency key reuse with different request content");
    }
    return {
      attempt_id: existing.id,
      signal_revision: existing.signal_revision,
      signal_revision_hash: existing.signal_revision_hash,
      status: existing.status,
      idempotent_replay: true,
    };
  }

  const attemptId = generateAttemptId();
  const { error: insertError } = await db.from("signal_attempts").insert({
    id: attemptId,
    signal_id: input.signalId,
    signal_revision: revision.revision,
    signal_revision_hash: revision.revision_hash,
    actor_id: input.actorId,
    actor_key_id: input.actorKeyId,
    status: "created",
    idempotency_key: input.idempotencyKey,
    request_hash: input.requestHash,
    declarations: input.declarations,
  });

  if (insertError) {
    // 23505 = unique violation. A concurrent duplicate with the same
    // (signal_id, actor_id, idempotency_key) won the insert race. Re-read
    // the existing row and classify: same request_hash = idempotent success,
    // different request_hash = conflict.
    if (insertError.code === "23505") {
      const { data: concurrent } = await db.from("signal_attempts")
        .select("*")
        .eq("signal_id", input.signalId)
        .eq("actor_id", input.actorId)
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (concurrent && concurrent.request_hash === input.requestHash) {
        // Legitimate concurrent duplicate — idempotent success
        return {
          attempt_id: concurrent.id,
          signal_revision: concurrent.signal_revision,
          signal_revision_hash: concurrent.signal_revision_hash,
          status: concurrent.status,
          idempotent_replay: true,
        };
      }
      // Same idempotency key but different content — conflict
      throw new Error("Idempotency key reuse with different request content");
    }
    throw insertError;
  }

  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    signal_revision_hash: revision.revision_hash,
    attempt_id: attemptId,
    event_type: "signal_attempt_created",
    payload: { actor_id: input.actorId },
  });

  return {
    attempt_id: attemptId,
    signal_revision: revision.revision,
    signal_revision_hash: revision.revision_hash,
    status: "created",
    idempotent_replay: false,
  };
}

// ─── Submit an attempt (§10.2) ───────────────────────────────────────────────

export async function submitAttempt(input: {
  signalId: string;
  attemptId: string;
  actorId: string;
  mediaType: string;
  bodyHash: string;
  body: string;
  artifactReferences?: Array<{ uri: string; digest: string }>;
}): Promise<{ attempt_id: string; status: string }> {
  const db = admin();
  const now = new Date().toISOString();

  const { data: attempt, error } = await db.from("signal_attempts")
    .select("*")
    .eq("id", input.attemptId)
    .eq("signal_id", input.signalId)
    .maybeSingle();
  if (error) throw error;
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.actor_id !== input.actorId) throw new Error("Not authorized: actor mismatch");
  if (attempt.status !== "created") throw new Error(`Attempt is in status ${attempt.status}, cannot submit`);

  const { error: updateError } = await db.from("signal_attempts").update({
    status: "submitted",
    submission_json: { body: input.body, artifact_references: input.artifactReferences ?? [] },
    submission_body_hash: input.bodyHash,
    submission_media_type: input.mediaType,
    submitted_at: now,
    updated_at: now,
  }).eq("id", input.attemptId);
  if (updateError) throw updateError;

  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    attempt_id: input.attemptId,
    submission_digest: input.bodyHash,
    event_type: "signal_attempt_submitted",
    payload: { media_type: input.mediaType },
  });

  return { attempt_id: input.attemptId, status: "submitted" };
}

// ─── Get an attempt ──────────────────────────────────────────────────────────

export async function getAttempt(signalId: string, attemptId: string, actorId?: string): Promise<Record<string, unknown> | null> {
  const db = admin();
  let query = db.from("signal_attempts").select("*").eq("id", attemptId).eq("signal_id", signalId);
  if (actorId) query = query.eq("actor_id", actorId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}

// ─── Withdraw an attempt ─────────────────────────────────────────────────────

export async function withdrawAttempt(input: {
  signalId: string;
  attemptId: string;
  actorId: string;
}): Promise<{ attempt_id: string; status: string }> {
  const db = admin();
  const now = new Date().toISOString();

  const { data: attempt, error } = await db.from("signal_attempts")
    .select("status, actor_id")
    .eq("id", input.attemptId)
    .eq("signal_id", input.signalId)
    .maybeSingle();
  if (error) throw error;
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.actor_id !== input.actorId) throw new Error("Not authorized");
  if (!["created", "submitted", "verification_pending"].includes(attempt.status)) {
    throw new Error(`Cannot withdraw attempt in status ${attempt.status}`);
  }

  const { error: updateError } = await db.from("signal_attempts").update({
    status: "withdrawn",
    withdrawn_at: now,
    updated_at: now,
  }).eq("id", input.attemptId);
  if (updateError) throw updateError;

  return { attempt_id: input.attemptId, status: "withdrawn" };
}

// ─── Record a verification result (§8, §12) ──────────────────────────────────
// This is called by the internal verifier worker, NOT by agents.
// A verification result is authoritative for the signal attempt ONLY.
// It can NEVER advance exchange state.

export async function recordVerification(input: {
  attemptId: string;
  signalRevisionHash: string;
  verifierId: string;
  verifierVersion: string;
  verifierDigest: string;
  status: "passed" | "failed" | "inconclusive" | "verifier_error";
  resultJson: Record<string, unknown>;
  resultDigest: string;
  environmentDigest: string;
  issuerKeyId: string;
  issuerSignature: string;
  startedAt: string;
  completedAt: string;
}): Promise<{ verification_id: string; status: string }> {
  const db = admin();
  const verificationId = generateVerificationId();

  // Defense-in-depth (Minor 4): verify the attempt is in a state that
  // can receive a verification result. A withdrawn or expired attempt
  // should not have a verification recorded against it — the Steward is
  // trusted, but this prevents stale worker jobs from corrupting state.
  const { data: attempt } = await db.from("signal_attempts")
    .select("status")
    .eq("id", input.attemptId)
    .maybeSingle();
  if (!attempt) throw new Error("Attempt not found");
  if (["withdrawn", "expired"].includes(attempt.status)) {
    throw new Error(`Cannot record verification for attempt in status ${attempt.status}`);
  }

  // Count existing verifications for this attempt to determine run_number
  const { count } = await db.from("signal_verifications")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", input.attemptId);
  const runNumber = (count ?? 0) + 1;

  const { error } = await db.from("signal_verifications").insert({
    id: verificationId,
    attempt_id: input.attemptId,
    signal_revision_hash: input.signalRevisionHash,
    verifier_id: input.verifierId,
    verifier_version: input.verifierVersion,
    verifier_digest: input.verifierDigest,
    run_number: runNumber,
    status: input.status,
    result_json: input.resultJson,
    result_digest: input.resultDigest,
    environment_digest: input.environmentDigest,
    issuer_key_id: input.issuerKeyId,
    issuer_signature: input.issuerSignature,
    started_at: input.startedAt,
    completed_at: input.completedAt,
  });
  if (error) throw error;

  // Update attempt status based on verification.
  // verifier_error gets its own distinct attempt status (not
  // verification_pending) so that §12.6 can be enforced: inconclusive
  // and verifier_error attempts do NOT count toward the attempt limit.
  const attemptStatus = input.status === "passed" ? "verified" :
    input.status === "failed" ? "rejected" :
    input.status === "inconclusive" ? "inconclusive" :
    input.status === "verifier_error" ? "verifier_error" : "verification_pending";

  await db.from("signal_attempts").update({
    status: attemptStatus,
    updated_at: new Date().toISOString(),
  }).eq("id", input.attemptId);

  await db.from("exchange_lineage").insert({
    attempt_id: input.attemptId,
    verification_id: verificationId,
    event_type: "signal_verification_recorded",
    payload: { status: input.status, run_number: runNumber },
  });

  return { verification_id: verificationId, status: input.status };
}

// ─── Issue a qualification (§9) ──────────────────────────────────────────────

export async function issueQualification(input: {
  signalId: string;
  signalRevision: number;
  attemptId: string;
  verificationId: string;
  actorId: string;
  issuerDomain: string;
  issuerKeyId: string;
  issuerSignature: string;
  expiresAt: string;
  maximumUses?: number;
  permittedFollowOn: string[];
}): Promise<{ qualification_id: string; status: string }> {
  const db = admin();
  const qualificationId = generateQualificationId();

  const { error } = await db.from("signal_qualifications").insert({
    id: qualificationId,
    signal_id: input.signalId,
    signal_revision: input.signalRevision,
    attempt_id: input.attemptId,
    verification_id: input.verificationId,
    subject_actor_id: input.actorId,
    status: "qualified",
    scope_json: {
      kind: "signal",
      value: input.signalId,
      permitted_follow_on: input.permittedFollowOn,
    },
    expires_at: input.expiresAt,
    maximum_uses: input.maximumUses ?? 1,
    uses_remaining: input.maximumUses ?? 1,
    issuer_domain: input.issuerDomain,
    issuer_key_id: input.issuerKeyId,
    issuer_signature: input.issuerSignature,
  });
  if (error) throw error;

  await db.from("exchange_lineage").insert({
    signal_id: input.signalId,
    attempt_id: input.attemptId,
    verification_id: input.verificationId,
    qualification_id: qualificationId,
    event_type: "signal_qualification_issued",
    payload: { actor_id: input.actorId, expires_at: input.expiresAt },
  });

  return { qualification_id: qualificationId, status: "qualified" };
}

// ─── Consume a qualification (when creating a proposal) ──────────────────────
//
// Uses optimistic locking to prevent race conditions: the UPDATE includes
// the expected uses_remaining value in its WHERE clause. If two concurrent
// requests both read uses_remaining=1, the first UPDATE succeeds (setting
// it to 0), and the second UPDATE matches zero rows (uses_remaining is no
// longer 1) — the second request gets null back and throws.

export async function consumeQualification(qualificationId: string, actorId: string): Promise<boolean> {
  const db = admin();
  const { data: qual, error } = await db.from("signal_qualifications")
    .select("*")
    .eq("id", qualificationId)
    .maybeSingle();
  if (error || !qual) throw new Error("Qualification not found");
  if (qual.subject_actor_id !== actorId) throw new Error("Not authorized: actor mismatch");
  if (qual.status !== "qualified") throw new Error(`Qualification is ${qual.status}, not qualified`);
  if (new Date(qual.expires_at) < new Date()) throw new Error("Qualification has expired");
  if (qual.uses_remaining <= 0) throw new Error("Qualification has no uses remaining");

  const newUsesRemaining = qual.uses_remaining - 1;
  const newStatus = newUsesRemaining === 0 ? "consumed" : "qualified";

  // Optimistic lock: include the expected uses_remaining in the WHERE
  // clause. If a concurrent request already decremented it, this update
  // matches zero rows and returns null — we detect the race and throw.
  const { data: updated, error: updateError } = await db.from("signal_qualifications")
    .update({
      uses_remaining: newUsesRemaining,
      status: newStatus,
    })
    .eq("id", qualificationId)
    .eq("uses_remaining", qual.uses_remaining)
    .eq("status", "qualified")
    .select()
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) {
    throw new Error("Qualification could not be consumed — it may have been consumed concurrently, expired, or revoked");
  }

  return true;
}

// ─── Get verification result for an attempt ──────────────────────────────────

export async function getVerification(attemptId: string): Promise<Record<string, unknown> | null> {
  const db = admin();
  const { data, error } = await db.from("signal_verifications")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("run_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// ─── Get qualification ───────────────────────────────────────────────────────

export async function getQualification(qualificationId: string): Promise<Record<string, unknown> | null> {
  const db = admin();
  const { data, error } = await db.from("signal_qualifications")
    .select("*")
    .eq("id", qualificationId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

// ─── Record proposal origin (§10.4, §13.6) ───────────────────────────────────

export async function recordProposalOrigin(input: {
  proposalId: string;
  originKind: "exchange_signal" | "unsolicited_opportunity" | "direct_request" | "other";
  signalId?: string;
  signalRevision?: number;
  signalRevisionHash?: string;
  attemptId?: string;
  verificationId?: string;
  qualificationId?: string;
  opportunityId?: string;
}): Promise<void> {
  const db = admin();
  const { error } = await db.from("contribution_proposal_origins").insert({
    proposal_id: input.proposalId,
    origin_kind: input.originKind,
    signal_id: input.signalId ?? null,
    signal_revision: input.signalRevision ?? null,
    signal_revision_hash: input.signalRevisionHash ?? null,
    attempt_id: input.attemptId ?? null,
    verification_id: input.verificationId ?? null,
    qualification_id: input.qualificationId ?? null,
    opportunity_id: input.opportunityId ?? null,
  });
  if (error) throw error;

  await db.from("exchange_lineage").insert({
    proposal_id: input.proposalId,
    signal_id: input.signalId,
    signal_revision_hash: input.signalRevisionHash,
    attempt_id: input.attemptId,
    verification_id: input.verificationId,
    qualification_id: input.qualificationId,
    event_type: "proposal_origin_recorded",
    payload: { origin_kind: input.originKind },
  });
}
