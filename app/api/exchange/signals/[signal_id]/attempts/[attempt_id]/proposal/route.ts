import { NextRequest, NextResponse } from "next/server";
import { getSignal, getAttempt, getVerification, getQualification, consumeQualification, recordProposalOrigin } from "@/lib/exchange/signal-server";
import { getExchangeAdmin, hashSecret, newPublicId, newSecret, requestIdentity, logEncounter } from "@/lib/exchange/server";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";
import { createHash } from "node:crypto";

/**
 * POST /api/exchange/signals/{signal_id}/attempts/{attempt_id}/proposal (§10.4).
 *
 * Creates an ordinary existing ContributionProposal from a signal attempt.
 * Requirements:
 * - attempt is eligible under the signal's follow-on policy
 * - qualification is valid and unconsumed if required
 * - actor matches the qualified subject
 * - signal and attempt lineage are attached
 * - the result is an ordinary existing ContributionProposal
 * - no Commitment transition occurs
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(["signal-proposal", ip], { windowMs: 60 * 60 * 1000, max: 10 }, true);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-proposal") } });

  const signal = await getSignal(signal_id);
  if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-proposal") });

  // Check follow-on mode
  if (signal.follow_on.mode === "none") {
    return NextResponse.json({ error: "Signal does not allow proposal follow-on" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  const actorKey = req.headers.get("x-exchange-agent-key") ?? req.headers.get("x-exchange-proposer-key");
  const actorId = actorKey ? `actor:${createHash("sha256").update(actorKey).digest("hex").slice(0, 16)}` : `anonymous:${ip}`;
  const attempt = await getAttempt(signal_id, attempt_id, actorId);
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-proposal") });

  if (attempt.status !== "verified") {
    return NextResponse.json({ error: "Attempt must be verified before creating a proposal" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  // Read the request body ONCE. The body may contain qualification_id,
  // title, proposed_contribution, and consideration. Reading req.json()
  // twice consumes the stream and silently drops user input.
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  // Check qualification if required
  let qualificationId: string | undefined;
  if (signal.follow_on.qualification_required) {
    const qualId = req.headers.get("x-qualification-id") ?? (body as Record<string, unknown>)?.qualification_id;
    if (!qualId || typeof qualId !== "string") {
      return NextResponse.json({ error: "Qualification ID required for this signal's follow-on policy" }, { status: 400, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
    }
    const qual = await getQualification(qualId);
    if (!qual) return NextResponse.json({ error: "Qualification not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
    if (qual.subject_actor_id !== actorId) return NextResponse.json({ error: "Qualification does not belong to this actor" }, { status: 403, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
    if (qual.status !== "qualified") return NextResponse.json({ error: `Qualification is ${qual.status}` }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
    qualificationId = qualId;
  }

  // Get verification
  const verification = await getVerification(attempt_id);
  if (!verification) return NextResponse.json({ error: "No verification found for attempt" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });

  // Create an ordinary ContributionProposal (existing exchange_records flow)
  const admin = getExchangeAdmin();
  const proposerKey = newSecret("proposal");
  const publicId = newPublicId();

  const proposalBody = body as Record<string, unknown>;
  const customTitle = typeof proposalBody.title === "string" ? proposalBody.title : undefined;
  const customContribution = typeof proposalBody.proposed_contribution === "string" ? proposalBody.proposed_contribution : undefined;
  const customConsideration = Array.isArray(proposalBody.consideration) ? proposalBody.consideration : undefined;

  const { data: proposal, error } = await admin.from("exchange_records").insert({
    public_id: publicId,
    kind: "contribution_proposal",
    state: "proposed",
    target_domain: signal.publisher.domain,
    title: customTitle ?? signal.title,
    observation: signal.summary,
    proposed_contribution: customContribution ?? signal.description,
    desired_outcome: signal.desired_outcome.description,
    evidence: signal.evidence?.map(e => e.uri) ?? [],
    proposed_consideration: customConsideration ?? [],
    proposal_detail: {
      category: signal.follow_on.proposal_template?.contribution_kind ?? "other",
      required_authorization: {
        inspect_public: !signal.constraints.private_data_access,
        sandbox_test: false,
        repository_read: false,
        repository_write: signal.constraints.repository_write,
        private_data: signal.constraints.private_data_access,
        credential_access: false,
        production_modify: signal.constraints.production_write,
        deploy: false,
        penetration_testing: false,
      },
    },
    proposer_key_hash: hashSecret(proposerKey),
  }).select("id, public_id, state, title, created_at").single();

  if (error) {
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  // Record the origin linkage (§13.6)
  await recordProposalOrigin({
    proposalId: proposal.id,
    originKind: "exchange_signal",
    signalId: signal_id,
    signalRevision: signal.revision,
    signalRevisionHash: signal.revision_hash,
    attemptId: attempt_id,
    verificationId: verification.id as string,
    qualificationId,
  });

  // Consume qualification if present. If consumption fails (race
  // condition, expiry, or revocation between the check above and now),
  // we perform a compensating delete of the proposal so we don't leave
  // an orphaned proposal with an unconsumed qualification that could
  // allow a duplicate. The contribution_proposal_origins row cascades
  // on delete, so it is cleaned up automatically.
  if (qualificationId) {
    try {
      await consumeQualification(qualificationId, actorId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown";
      // Compensating action: delete the proposal we just created.
      await admin.from("exchange_records").delete().eq("id", proposal.id);
      return NextResponse.json(
        { error: "Qualification consumption failed — proposal not created", detail: reason },
        { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") },
      );
    }
  }

  await logEncounter({
    targetDomain: signal.publisher.domain,
    endpoint: `/api/exchange/signals/${signal_id}/attempts/${attempt_id}/proposal`,
    req,
    method: "POST",
    result: "ok",
    metadata: { proposal_id: proposal.public_id },
  });

  return NextResponse.json(
    {
      proposal: {
        ...proposal,
        origin: {
          kind: "exchange_signal",
          signal_id,
          signal_revision: signal.revision,
          signal_revision_hash: signal.revision_hash,
          attempt_id,
          verification_id: verification.id,
          qualification_id: qualificationId,
        },
      },
      proposer_key: proposerKey,
      warning: "Save this proposal key. This is an ordinary Contribution Proposal. No Commitment has been created. Bilateral terms-hash acceptance is still required.",
    },
    { status: 201, headers: distributedRateLimitHeaders(rl, "signal-proposal") },
  );
}
