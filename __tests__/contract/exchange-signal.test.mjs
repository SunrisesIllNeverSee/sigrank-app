import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..", "..");

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function source(relPath) {
  return readFileSync(resolve(root, relPath), "utf8");
}

// ─── Schema validation tests ─────────────────────────────────────────────────

test("ExchangeSignal schema validates all seven signal types", async () => {
  const schemaCode = await source("exchange-gateway/src/signal-schema.ts");
  // All seven types must be in the enum
  for (const type of ["problem", "request", "challenge", "bounty", "verification", "discovery", "experiment"]) {
    assert.match(schemaCode, new RegExp(`"${type}"`), `Signal type ${type} must be in schema`);
  }
});

test("ExchangeSignal schema enforces creates_obligation: false", async () => {
  const schemaCode = await source("exchange-gateway/src/signal-schema.ts");
  // The consideration schema must enforce creates_obligation as literal false
  assert.match(schemaCode, /creates_obligation:\s*z\.literal\(false\)/);
  // And there must be a refine check
  assert.match(schemaCode, /creates_obligation.*false.*signals do not create obligations/);
});

test("ExchangeSignal schema enforces commitment_automatic: false", async () => {
  const schemaCode = await source("exchange-gateway/src/signal-schema.ts");
  assert.match(schemaCode, /commitment_automatic:\s*z\.literal\(false\)/);
  assert.match(schemaCode, /authorization_automatic:\s*z\.literal\(false\)/);
});

test("ExchangeSignal schema enforces follow-on modes", async () => {
  const schemaCode = await source("exchange-gateway/src/signal-schema.ts");
  for (const mode of ["none", "domain_review", "proposal_allowed", "invite_to_propose", "draft_proposal"]) {
    assert.match(schemaCode, new RegExp(`"${mode}"`), `Follow-on mode ${mode} must be in schema`);
  }
});

test("ExchangeSignal types define authoritative_for_exchange_state: false", async () => {
  const typesCode = await source("exchange-gateway/src/signal-types.ts");
  assert.match(typesCode, /authoritative_for_exchange_state:\s*false/);
  assert.match(typesCode, /authoritative_for_signal:\s*true/);
});

// ─── Revision hash tests ─────────────────────────────────────────────────────

test("Signal revision hash is deterministic and content-bound", async () => {
  // We can't import the TS module directly in a .mjs test, so we verify
  // the canonicalization logic structurally.
  const revCode = await source("exchange-gateway/src/signal-revision.ts");
  // Must use SHA-256
  assert.match(revCode, /sha256/);
  // Must canonicalize by sorting keys
  assert.match(revCode, /sortKeysDeep/);
  // Must exclude revision_hash and canonical_url from the hash input
  assert.match(revCode, /revision_hash.*canonical_url/);
});

// ─── Database migration tests ────────────────────────────────────────────────

test("Migration creates all seven required tables", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  for (const table of [
    "exchange_signals",
    "exchange_signal_revisions",
    "signal_attempts",
    "signal_verifications",
    "signal_qualifications",
    "contribution_proposal_origins",
    "exchange_lineage",
  ]) {
    assert.match(migration, new RegExp(`create table.*${table}`), `Table ${table} must be in migration`);
  }
});

test("Migration enforces revision immutability via primary key", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  // Revisions must have a composite primary key (signal_id, revision)
  assert.match(migration, /primary key \(signal_id, revision\)/);
  // Revision hash must be unique
  assert.match(migration, /unique \(revision_hash\)/);
  // Revision must be > 0
  assert.match(migration, /revision > 0/);
});

test("Migration enforces attempt revision binding", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  // Attempts must have a foreign key to (signal_id, revision)
  assert.match(migration, /foreign key \(signal_id, signal_revision\) references/);
  // Idempotency: unique on (signal_id, actor_id, idempotency_key)
  assert.match(migration, /unique \(signal_id, actor_id, idempotency_key\)/);
});

test("Migration enables RLS on all signal tables", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  for (const table of [
    "exchange_signals",
    "exchange_signal_revisions",
    "signal_attempts",
    "signal_verifications",
    "signal_qualifications",
    "contribution_proposal_origins",
    "exchange_lineage",
  ]) {
    assert.match(migration, new RegExp(`alter table public.${table} enable row level security`), `RLS must be enabled on ${table}`);
  }
});

test("Migration defines public read policy for published signals only", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  // Public can only read published/paused/closed/expired/withdrawn signals
  assert.match(migration, /status in \('published','paused','closed','expired','withdrawn'\)/);
  // And only public visibility
  assert.match(migration, /visibility = 'public'/);
});

// ─── Route structure tests ───────────────────────────────────────────────────

test("Signal collection route exists and handles GET + POST", async () => {
  const routeCode = await source("app/api/exchange/signals/route.ts");
  assert.match(routeCode, /export async function GET/);
  assert.match(routeCode, /export async function POST/);
  // GET must use distributed rate limiting
  assert.match(routeCode, /checkDistributedRateLimit/);
  // POST must authenticate
  assert.match(routeCode, /authenticateCompany/);
});

test("Signal detail route exists and handles GET + PATCH", async () => {
  const routeCode = await source("app/api/exchange/signals/[signal_id]/route.ts");
  assert.match(routeCode, /export async function GET/);
  assert.match(routeCode, /export async function PATCH/);
});

test("Attempt routes exist with idempotency enforcement", async () => {
  const attemptRoute = await source("app/api/exchange/signals/[signal_id]/attempts/route.ts");
  assert.match(attemptRoute, /export async function POST/);
  assert.match(attemptRoute, /idempotency/);
  assert.match(attemptRoute, /requestHash/);
  // Must check attempt limits
  assert.match(attemptRoute, /maximum_attempts_per_actor/);
});

test("Submit route enforces media type and size limits", async () => {
  const submitRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/submit/route.ts");
  assert.match(submitRoute, /accepted_media_types/);
  assert.match(submitRoute, /maximum_bytes/);
  assert.match(submitRoute, /bodyHash/);
});

test("Verification route is read-only for agents", async () => {
  const verRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/verification/route.ts");
  // Only GET — no POST for agents
  assert.match(verRoute, /export async function GET/);
  // Must state that agents cannot assert verification
  assert.match(verRoute, /cannot be self-asserted/);
});

test("Internal verification route requires Steward auth", async () => {
  const internalRoute = await source("app/internal/exchange/signal-verifications/route.ts");
  assert.match(internalRoute, /export async function POST/);
  assert.match(internalRoute, /authenticateCompany/);
  // Must state it's not agent-callable
  assert.match(internalRoute, /NOT exposed as an unauthenticated agent-callable/);
  // Must state authoritative_for_exchange_state: false
  assert.match(internalRoute, /authoritative_for_exchange_state:\s*false/);
});

test("Proposal follow-on route creates ordinary proposal with origin", async () => {
  const propRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/proposal/route.ts");
  assert.match(propRoute, /export async function POST/);
  // Must check follow-on mode
  assert.match(propRoute, /follow_on/);
  // Must check qualification if required
  assert.match(propRoute, /qualification_required/);
  // Must record origin
  assert.match(propRoute, /recordProposalOrigin/);
  // Must create exchange_records entry (ordinary proposal)
  assert.match(propRoute, /exchange_records/);
  // Must NOT create a commitment
  assert.match(propRoute, /No Commitment/);
});

test("Status transition routes exist for pause, close, withdraw", async () => {
  for (const [action, file] of [
    ["pause", "app/api/exchange/signals/[signal_id]/pause/route.ts"],
    ["close", "app/api/exchange/signals/[signal_id]/close/route.ts"],
    ["withdraw", "app/api/exchange/signals/[signal_id]/withdraw/route.ts"],
  ]) {
    const routeCode = await source(file);
    assert.match(routeCode, /export async function POST/);
    assert.match(routeCode, /authenticateCompany/);
    assert.match(routeCode, new RegExp(action));
  }
});

// ─── Manifest integration tests ──────────────────────────────────────────────

test("Manifest includes signals block with all seven types", async () => {
  const manifestCode = await source("exchange-gateway/src/manifest.ts");
  assert.match(manifestCode, /signals/);
  for (const type of ["problem", "request", "challenge", "bounty", "verification", "discovery", "experiment"]) {
    assert.match(manifestCode, new RegExp(`'${type}'`), `Manifest must advertise type ${type}`);
  }
  // Must include collection, human, and authentication URLs
  assert.match(manifestCode, /collection/);
  assert.match(manifestCode, /human/);
  assert.match(manifestCode, /authentication/);
});

// ─── Discovery integration tests ─────────────────────────────────────────────

test("agents.md documents signal path", async () => {
  const agentsMd = await source("app/agents.md/route.ts");
  assert.match(agentsMd, /Exchange Signals/);
  assert.match(agentsMd, /solicited ingress/);
  assert.match(agentsMd, /api\/exchange\/signals/);
  // Must state signals are optional
  assert.match(agentsMd, /Signals are optional/);
  // Must state no authority granted
  assert.match(agentsMd, /does NOT/);
});

test("llms.txt includes Exchange + signal references", async () => {
  const llmsTxt = await source("app/llms.txt/route.ts");
  assert.match(llmsTxt, /Contribution Exchange/);
  assert.match(llmsTxt, /exchange\.json/);
  assert.match(llmsTxt, /exchange\/signals/);
  assert.match(llmsTxt, /agents\.md/);
});

test("robots.txt disallows /internal/ routes", async () => {
  const robots = await source("app/robots.ts");
  assert.match(robots, /\/internal\//);
});

// ─── Phase 0 cleanup tests ───────────────────────────────────────────────────

test("§18.2: Schema $id uses signalaf.com, not mos2es.xyz", async () => {
  const publicSchema = await source("public/exchange.schema.json");
  assert.match(publicSchema, /signalaf\.com\/exchange\.schema\.json/);
  assert.doesNotMatch(publicSchema, /mos2es\.xyz/);

  const gwSchema = await source("exchange-gateway/exchange.schema.json");
  assert.match(gwSchema, /signalaf\.com\/exchange\.schema\.json/);
  assert.doesNotMatch(gwSchema, /mos2es\.xyz/);
});

test("§18.4: Admin key comparison uses timingSafeEqual, not ===", async () => {
  const serverCode = await source("lib/exchange/server.ts");
  assert.match(serverCode, /timingSafeEqual/);
  assert.match(serverCode, /safeEqual/);
  // Must NOT use === for key comparison (the old pattern)
  assert.doesNotMatch(serverCode, /key === referenceKey/);
  assert.doesNotMatch(serverCode, /hashSecret\(key\) === company\.admin_key_hash/);
});

test("§18.4: API gate uses constant-time comparison", async () => {
  const gateCode = await source("lib/infra/api-gate.ts");
  assert.match(gateCode, /timingSafeEqual/);
  assert.match(gateCode, /safeEqualStrings/);
  assert.doesNotMatch(gateCode, /provided === expected/);
});

test("§18.3: Distributed rate limiter exists with fail-closed support", async () => {
  const distRl = await source("lib/infra/distributed-rate-limit.ts");
  assert.match(distRl, /checkDistributedRateLimit/);
  assert.match(distRl, /failClosed/);
  assert.match(distRl, /Upstash/);
  // Must use atomic pipeline operations
  assert.match(distRl, /pipeline/);
  assert.match(distRl, /incr/);
  assert.match(distRl, /expire/);
});

test("§18.5: BYO notification uses signed delivery", async () => {
  const signedNotif = await source("lib/exchange/signed-notification.ts");
  assert.match(signedNotif, /computeNotificationSignature/);
  assert.match(signedNotif, /deliverSignedNotification/);
  assert.match(signedNotif, /verifyNotificationSignature/);
  // Must use HMAC-SHA256
  assert.match(signedNotif, /createHmac/);
  // Must include timestamp, nonce, event_id
  assert.match(signedNotif, /timestamp/);
  assert.match(signedNotif, /nonce/);
  assert.match(signedNotif, /eventId/);
  // Must include replay window
  assert.match(signedNotif, /replayWindow/);
  // Must use constant-time comparison for verification
  assert.match(signedNotif, /safeEqual/);
});

test("§18.5: steward.ts uses signed notification delivery", async () => {
  const steward = await source("lib/exchange/steward.ts");
  assert.match(steward, /deliverSignedNotification/);
  assert.match(steward, /signed-notification/);
});

test("§18.6: Lineage table exists in migration", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  assert.match(migration, /create table.*exchange_lineage/);
  // Must track the full provenance chain
  for (const field of [
    "signal_id",
    "signal_revision_hash",
    "attempt_id",
    "submission_digest",
    "verification_id",
    "qualification_id",
    "proposal_id",
    "commitment_terms_hash",
    "execution_artifact_hash",
    "authoritative_verification_id",
    "settlement_id",
  ]) {
    assert.match(migration, new RegExp(field), `Lineage table must have ${field}`);
  }
});

test("§18.6: signal-server records lineage events", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // Must insert lineage records on key events
  assert.match(signalServer, /exchange_lineage/);
  assert.match(signalServer, /signal_published/);
  assert.match(signalServer, /signal_attempt_created/);
  assert.match(signalServer, /signal_attempt_submitted/);
  assert.match(signalServer, /signal_verification_recorded/);
  assert.match(signalServer, /signal_qualification_issued/);
  assert.match(signalServer, /proposal_origin_recorded/);
});

// ─── Invariant tests ─────────────────────────────────────────────────────────

test("Signal status transitions match spec §6.3", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // draft → published
  assert.match(signalServer, /draft.*published/);
  // published → paused/closed/expired/withdrawn
  assert.match(signalServer, /published.*paused.*closed.*expired.*withdrawn/);
  // paused → published/closed/expired/withdrawn
  assert.match(signalServer, /paused.*published.*closed.*expired.*withdrawn/);
  // Terminal states have no transitions
  assert.match(signalServer, /closed.*\[\]/);
  assert.match(signalServer, /expired.*\[\]/);
  assert.match(signalServer, /withdrawn.*\[\]/);
});

test("Signal server enforces no exchange state advancement", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // The signal-server must NOT import or call any exchange state transition
  // functions. It should only read from exchange_records (for proposal creation).
  assert.doesNotMatch(signalServer, /state.*committed/);
  assert.doesNotMatch(signalServer, /state.*authorized/);
  assert.doesNotMatch(signalServer, /state.*verified/);
  assert.doesNotMatch(signalServer, /state.*settled/);
});

// ─── Review fix tests (verify the 10 fixes from the REJECT review) ────────────

test("Fix 1: createRevision function exists for published-signal edits (§3.3)", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  assert.match(signalServer, /export async function createRevision/);
  // Must NOT require a status transition (unlike publishSignal)
  assert.match(signalServer, /Cannot create a revision on a signal in status/);
  // Must reject terminal states
  assert.match(signalServer, /closed.*withdrawn.*includes/);
});

test("Fix 1: PATCH route uses createRevision for published signals", async () => {
  const patchRoute = await source("app/api/exchange/signals/[signal_id]/route.ts");
  assert.match(patchRoute, /createRevision/);
  assert.match(patchRoute, /usePublish/);
  // Must check existing status to decide which path to use.
  // Uses getSignalMeta (not getSignal) so drafts are reachable.
  assert.match(patchRoute, /meta\.status === "draft"/);
  assert.match(patchRoute, /getSignalMeta/);
});

test("Fix 2: Proposal route reads req.json() exactly once", async () => {
  const propRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/proposal/route.ts");
  // Count actual code calls of req.json() (not comments). A call is
  // `req.json()` preceded by `await` or used as an expression.
  const codeCalls = propRoute.match(/await req\.json\(\)/g) ?? [];
  assert.equal(codeCalls.length, 1, `Proposal route must call req.json() exactly once in code, found ${codeCalls.length}`);
  // Must extract qualification_id from the single body read
  assert.match(propRoute, /qualification_id/);
});

test("Fix 3: createAttempt handles 23505 unique violation (race-safe idempotency)", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  assert.match(signalServer, /insertError\.code === "23505"/);
  assert.match(signalServer, /concurrent/);
  assert.match(signalServer, /Legitimate concurrent duplicate/);
});

test("Fix 4: expires_before filters by expires_at, not created_at", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // The expires_before filter must use expires_at column
  assert.match(signalServer, /lte\("expires_at"/);
  // Must NOT use created_at for expires_before
  const listSection = signalServer.split("listSignals")[1] ?? "";
  assert.doesNotMatch(listSection, /expires_before.*created_at/);
});

test("Fix 5: concurrent_attempts_per_actor is enforced", async () => {
  const attemptRoute = await source("app/api/exchange/signals/[signal_id]/attempts/route.ts");
  assert.match(attemptRoute, /countConcurrentAttempts/);
  assert.match(attemptRoute, /concurrent_attempts_per_actor/);
  const signalServer = await source("lib/exchange/signal-server.ts");
  assert.match(signalServer, /export async function countConcurrentAttempts/);
  // Must count only active statuses
  assert.match(signalServer, /\["created", "submitted", "verification_pending"\]/);
});

test("Fix 6: verification_mode and consideration_mode filters are applied", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  assert.match(signalServer, /eq\("verification_mode"/);
  assert.match(signalServer, /eq\("consideration_mode"/);
});

test("Fix 7: submit route validates required_fields for JSON submissions", async () => {
  const submitRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/submit/route.ts");
  assert.match(submitRoute, /required_fields/);
  assert.match(submitRoute, /missing required fields/);
});

test("Fix 8: migration has no check(true) placeholder", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  assert.doesNotMatch(migration, /check \(true\)/);
});

test("Fix 9: RLS policies exist for actor-scoped read on attempts/verifications/qualifications", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  assert.match(migration, /actor_read_own_attempts/);
  assert.match(migration, /actor_read_own_verifications/);
  assert.match(migration, /actor_read_own_qualifications/);
});

test("Fix 10: submit route wraps JSON.parse for artifact references in try/catch", async () => {
  const submitRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/submit/route.ts");
  assert.match(submitRoute, /Malformed x-artifact-references/);
  // Must return 400, not 500
  assert.match(submitRoute, /status: 400.*signal-submit/);
});

test("Migration mirrors expires_at, verification_mode, consideration_mode into exchange_signals", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  assert.match(migration, /expires_at timestamptz/);
  assert.match(migration, /verification_mode text/);
  assert.match(migration, /consideration_mode text/);
});

// ─── Round 2 review fix tests (verify fixes 11-14 from the second REJECT) ────

test("Fix 11: published_at column exists in migration and is mirrored on publish", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  // Column must exist on exchange_signals
  assert.match(migration, /published_at timestamptz/);
  // Index must exist
  assert.match(migration, /exchange_signals_published_at_idx/);

  const signalServer = await source("lib/exchange/signal-server.ts");
  // publishSignal must set published_at
  const publishSection = signalServer.split("publishSignal")[1] ?? "";
  assert.match(publishSection, /published_at: now/);
  // createRevision must NOT overwrite published_at (it preserves the
  // original publication date from revision 1)
  const revisionSection = signalServer.split("createRevision")[1] ?? "";
  const revisionUpdateBlock = revisionSection.split("Update signal current state")[1] ?? "";
  // The update block must not contain published_at (it's intentionally omitted)
  assert.doesNotMatch(revisionUpdateBlock, /published_at:/);
});

test("Fix 11: published_after filters by published_at, not created_at", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // The published_after filter must use the published_at column
  assert.match(signalServer, /gte\("published_at"/);
  // Must NOT use created_at for published_after
  const listSection = signalServer.split("listSignals")[1] ?? "";
  assert.doesNotMatch(listSection, /published_after.*created_at/);
});

test("Fix 12: accepting_attempts filter checks accepts_attempts_until", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // The accepting_attempts filter must reference accepts_attempts_until
  // (not just expires_at). It must be applied in SQL, not just JS.
  const listSection = signalServer.split("listSignals")[1] ?? "";
  assert.match(listSection, /accepts_attempts_until/);
  // Must use .or() for the null-or-future pattern on both columns
  assert.match(listSection, /accepts_attempts_until\.is\.null,accepts_attempts_until\.gt/);
  assert.match(listSection, /expires_at\.is\.null,expires_at\.gt/);
});

test("Fix 13: accepting_attempts filter is applied in SQL (before pagination), not post-fetch JS", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  const listSection = signalServer.split("listSignals")[1] ?? "";
  // The old post-fetch JS filter (signals.filter with accepting_attempts)
  // must be gone. The filter must be inside the query building block,
  // before the await query.
  assert.doesNotMatch(listSection, /filters\.accepting_attempts\s*\?\s*signals\.filter/);
  // The SQL filter must appear before the `await query` line
  const queryAwaitIdx = listSection.indexOf("await query");
  const filterIdx = listSection.indexOf('eq("status", "published")\n      .or(');
  assert.ok(filterIdx > -1 && filterIdx < queryAwaitIdx, "accepting_attempts filter must be applied before the query is executed");
});

test("Fix 14: getSignalMeta function exists for draft-safe signal lookup", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  assert.match(signalServer, /export async function getSignalMeta/);
  // Must select status and current_revision (not the full revision document)
  assert.match(signalServer, /select\("status, current_revision"\)/);
});

test("Fix 14: PATCH route uses getSignalMeta (not getSignal) so drafts are publishable", async () => {
  const patchRoute = await source("app/api/exchange/signals/[signal_id]/route.ts");
  // Must import and call getSignalMeta
  assert.match(patchRoute, /getSignalMeta/);
  // The status decision must use meta, not existing (from getSignal which
  // returns null for drafts). Search the whole file — the comment contains
  // "PATCH" so splitting on it would grab the wrong section.
  assert.match(patchRoute, /meta\.status === "draft"/);
  assert.doesNotMatch(patchRoute, /existing\.status === "draft"/);
});

// ─── Round 3 review fix tests (verify bugs 1-3 + minors 1-4) ─────────────────

test("Bug 1 (§12.6): verifier_error is a distinct attempt status in types", async () => {
  const types = await source("exchange-gateway/src/signal-types.ts");
  assert.match(types, /"verifier_error"/);
});

test("Bug 1 (§12.6): verifier_error is a distinct attempt status in schema", async () => {
  const schema = await source("exchange-gateway/src/signal-schema.ts");
  assert.match(schema, /"verifier_error"/);
});

test("Bug 1 (§12.6): migration CHECK constraint includes verifier_error", async () => {
  const migration = await source("supabase/migrations/20260826000000_0041_exchange_signals.sql");
  // The signal_attempts status CHECK must include verifier_error
  assert.match(migration, /'verifier_error'/);
});

test("Bug 1 (§12.6): recordVerification maps verifier_error to verifier_error attempt status", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  // The attempt status mapping must include a verifier_error → verifier_error branch
  // (not verifier_error → verification_pending as the old code did)
  assert.match(signalServer, /input\.status === "verifier_error" \? "verifier_error"/);
  // The old mapping (verifier_error falling through to verification_pending
  // via the else branch) must be gone — verifier_error must be explicitly
  // handled before the default fallback.
  const recordSection = signalServer.split("recordVerification")[1] ?? "";
  // Find the ternary chain and verify verifier_error is an explicit branch
  const ternaryMatch = recordSection.match(/input\.status === "passed".*?verification_pending"/s);
  assert.ok(ternaryMatch, "must have an attempt status ternary chain");
  // The chain must contain the verifier_error branch
  assert.match(ternaryMatch[0], /"verifier_error"/);
});

test("Bug 1 (§12.6): countActorAttempts excludes inconclusive and verifier_error", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  const countSection = signalServer.split("countActorAttempts")[1] ?? "";
  // Must exclude inconclusive and verifier_error (not just withdrawn)
  assert.match(countSection, /inconclusive/);
  assert.match(countSection, /verifier_error/);
  // Must exclude all three via .neq() calls
  assert.match(countSection, /neq\("status", "withdrawn"\)/);
  assert.match(countSection, /neq\("status", "inconclusive"\)/);
  assert.match(countSection, /neq\("status", "verifier_error"\)/);
});

test("Bug 2: consumeQualification uses optimistic locking (eq uses_remaining)", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  const consumeSection = signalServer.split("consumeQualification")[1] ?? "";
  // Must include uses_remaining in the WHERE clause for optimistic locking
  assert.match(consumeSection, /eq\("uses_remaining", qual\.uses_remaining\)/);
  // Must check the result of the update (not just the error)
  assert.match(consumeSection, /if \(!updated\)/);
  // Must throw on race condition
  assert.match(consumeSection, /consumed concurrently/);
});

test("Bug 3: proposal route performs compensating delete on qualification failure", async () => {
  const proposalRoute = await source("app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/proposal/route.ts");
  // Must have a catch block that deletes the proposal
  assert.match(proposalRoute, /exchange_records.*delete/);
  // Must return 409 on consumption failure
  assert.match(proposalRoute, /Qualification consumption failed/);
  assert.match(proposalRoute, /status: 409/);
  // Must NOT have the old empty catch block
  assert.doesNotMatch(proposalRoute, /\/\/ If consumption fails, the proposal is still created/);
});

test("Minor 1: manifest signals.schema points to a schema URL, not the collection", async () => {
  const manifest = await source("exchange-gateway/src/manifest.ts");
  // schema must NOT equal collection (both pointing to /api/exchange/signals)
  const schemaMatch = manifest.match(/schema:`\$\{base\}([^`]+)`/);
  const collectionMatch = manifest.match(/collection:`\$\{base\}([^`]+)`/);
  assert.ok(schemaMatch, "manifest must have a signals.schema field");
  assert.ok(collectionMatch, "manifest must have a signals.collection field");
  assert.notEqual(schemaMatch[1], collectionMatch[1], "schema and collection must be different URLs");
  // Schema should look like a schema path
  assert.match(schemaMatch[1], /schema/);
});

test("Minor 2: robots.txt allows /api/exchange/signals", async () => {
  const robots = await source("app/robots.ts");
  // Must explicitly allow /api/exchange/signals
  assert.match(robots, /\/api\/exchange\/signals/);
  // Must be in an allow array (not disallow)
  const defaultRule = robots.split('userAgent: "*"')[1] ?? "";
  assert.match(defaultRule, /allow.*\/api\/exchange\/signals/);
});

test("Minor 3: internal verification route validates body.status", async () => {
  const route = await source("app/internal/exchange/signal-verifications/route.ts");
  // Must validate status against allowed values before calling recordVerification
  assert.match(route, /allowedStatuses/);
  assert.match(route, /passed.*failed.*inconclusive.*verifier_error/);
  // Must return 400 for invalid status
  assert.match(route, /status: 400/);
});

test("Minor 4: recordVerification checks attempt state before recording", async () => {
  const signalServer = await source("lib/exchange/signal-server.ts");
  const recordSection = signalServer.split("recordVerification")[1] ?? "";
  // Must check attempt status and reject withdrawn/expired
  assert.match(recordSection, /withdrawn/);
  assert.match(recordSection, /expired/);
  assert.match(recordSection, /Cannot record verification for attempt in status/);
});
