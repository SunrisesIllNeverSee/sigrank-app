import { NextRequest, NextResponse } from "next/server";
import { getSignal, getAttempt, getVerification, getQualification, consumeQualification, recordProposalOrigin } from "@/lib/exchange/signal-server";
import { findCompany, getExchangeAdmin, hashSecret, newPublicId, newSecret, requestIdentity, logEncounter } from "@/lib/exchange/server";
import { resolveValidatedActor } from "@/lib/exchange/mcp-tools";
import { z } from "zod";
import { ConsiderationSchema } from "@/lib/exchange-gateway/src/schema";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

// Same limits as the canonical ProposalSchema (title 5-300, contribution
// 10-20000 chars, <=20 consideration entries). Unlike unsolicited proposals
// this is the solicited `proposal_allowed` path, so no accepts_unsolicited gate.
const AttemptProposalBodySchema = z.object({
  title: z.string().trim().min(5).max(300).optional(),
  proposed_contribution: z.string().trim().min(10).max(20_000).optional(),
  consideration: z.array(ConsiderationSchema).max(20).optional(),
  qualification_id: z.string().trim().min(1).max(200).optional(),
});

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

  const actor = await resolveValidatedActor(req, ip);
  if (!actor.ok) return NextResponse.json({ error: actor.error }, { status: actor.status, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  const { actorId } = actor;
  const attempt = await getAttempt(signal_id, attempt_id, actorId);
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-proposal") });

  if (attempt.status !== "verified") {
    return NextResponse.json({ error: "Attempt must be verified before creating a proposal" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  // Read the request body ONCE, then validate with the same limits as normal proposals.
  const rawBody = await req.json().catch(() => ({}));
  const parsedBody = AttemptProposalBodySchema.safeParse(rawBody ?? {});
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid proposal body", details: parsedBody.error.flatten() }, { status: 400, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }
  const body = parsedBody.data;

  // The publisher must be a verified company (parity with unsolicited proposals).
  const publisher = await findCompany(signal.publisher.domain);
  if (!publisher || publisher.verification_status !== "verified") {
    return NextResponse.json({ error: "Publisher domain is not verified" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  // One proposal per attempt.
  const preAdmin = getExchangeAdmin();
  const { data: priorOrigin, error: priorError } = await preAdmin
    .from("contribution_proposal_origins")
    .select("id")
    .eq("attempt_id", attempt_id)
    .eq("signal_id", signal_id)
    .limit(1);
  if (priorError) {
    return NextResponse.json({ error: "Failed to check existing proposals" }, { status: 500, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }
  if (priorOrigin && priorOrigin.length > 0) {
    return NextResponse.json({ error: "A proposal has already been created from this attempt" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

  // Check qualification if required
  let qualificationId: string | undefined;
  if (signal.follow_on.qualification_required) {
    const qualId = req.headers.get("x-qualification-id") ?? body.qualification_id;
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
  const admin = preAdmin;
  const proposerKey = newSecret("proposal");
  const publicId = newPublicId();

  const customTitle = body.title;
  const customContribution = body.proposed_contribution;
  const customConsideration = body.consideration;

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

  // Race guard (no unique index): if a concurrent request linked a proposal to
  // this attempt first, discard ours.
  const { data: origins } = await admin
    .from("contribution_proposal_origins")
    .select("proposal_id")
    .eq("attempt_id", attempt_id)
    .eq("signal_id", signal_id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (origins && origins.length > 1 && origins[0].proposal_id !== proposal.id) {
    await admin.from("exchange_records").delete().eq("id", proposal.id);
    return NextResponse.json({ error: "A proposal has already been created from this attempt" }, { status: 409, headers: distributedRateLimitHeaders(rl, "signal-proposal") });
  }

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
