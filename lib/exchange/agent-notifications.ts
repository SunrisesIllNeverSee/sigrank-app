/**
 * lib/exchange/agent-notifications.ts — exchange event → agent email
 * notifications via AgentMail.
 *
 * This module bridges the exchange's event system (appendExchangeEvent) to
 * AgentMail. When an exchange event occurs that affects an agent, this
 * module sends an async email notification to that agent's inbox.
 *
 * Notifications are best-effort: if AgentMail is not configured or the
 * agent has no inbox, the notification is silently skipped. The exchange
 * event itself is the authoritative record — the email is a convenience.
 *
 * Notification triggers:
 * - attempt_submitted → receipt to submitting agent
 * - attempt_verified → result to submitting agent
 * - attempt_rejected → reason to submitting agent
 * - proposal_created → confirmation to proposer
 * - proposal_accepted/rejected → outcome to proposer
 * - exchange_state_changed → notification to all parties
 * - execution_receipt_submitted → confirmation to executor
 */

import { ensureAgentInbox, sendAgentNotification } from "@/lib/infra/agentmail/client";
import { hashSecret } from "./server";

interface NotificationContext {
  /** The agent's raw key (hashed before sending to AgentMail). */
  agentKey?: string | null;
  /** The signal ID or exchange ID this notification relates to. */
  resourceId: string;
  /** Human-readable resource type: "signal", "exchange", "proposal". */
  resourceType: string;
  /** The event type from appendExchangeEvent. */
  eventType: string;
  /** Additional context for the email body. */
  details?: Record<string, unknown>;
}

/**
 * Send a notification to an agent about an exchange event.
 *
 * This is fire-and-forget from the caller's perspective — it never throws
 * and never blocks the exchange flow. The return value is only useful for
 * testing.
 */
export async function notifyAgent(ctx: NotificationContext): Promise<boolean> {
  if (!ctx.agentKey) return false;

  try {
    // Derive the agent key hash — this is what we use to look up/create
    // the inbox. We never send the raw key to AgentMail.
    const agentKeyHash = hashSecret(ctx.agentKey).slice(0, 16);

    // Ensure the agent has an inbox
    const inbox = await ensureAgentInbox(agentKeyHash);
    if (!inbox) return false;

    // Build the notification
    const { subject, text, html } = buildNotification(ctx);

    // Send to the agent's own inbox email (they receive it there)
    const result = await sendAgentNotification(
      inbox.inbox_id,
      inbox.email,
      subject,
      text,
      html,
    );

    return result !== null;
  } catch {
    return false;
  }
}

function buildNotification(ctx: NotificationContext): {
  subject: string;
  text: string;
  html: string;
} {
  const resourceLabel = `${ctx.resourceType} ${ctx.resourceId}`;
  const timestamp = new Date().toISOString();

  switch (ctx.eventType) {
    case "attempt_submitted":
    case "exchange_attempt_submitted": {
      const bodyHash = ctx.details?.body_hash as string | undefined;
      const attemptId = ctx.details?.attempt_id as string | undefined;
      return {
        subject: `[SigRank] Submission received — ${resourceLabel}`,
        text: [
          `Your submission has been received.`,
          ``,
          `Signal: ${ctx.resourceId}`,
          attemptId ? `Attempt: ${attemptId}` : "",
          bodyHash ? `Body hash: ${bodyHash}` : "",
          `Time: ${timestamp}`,
          ``,
          `Verification will be performed by the Steward. This does not verify a Contribution or advance exchange state.`,
          ``,
          `— SigRank Exchange`,
        ].filter(Boolean).join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>Your submission has been received.</p>
<ul>
<li><strong>Signal:</strong> ${ctx.resourceId}</li>
${ctx.details?.attempt_id ? `<li><strong>Attempt:</strong> ${ctx.details.attempt_id}</li>` : ""}
${bodyHash ? `<li><strong>Body hash:</strong> ${bodyHash}</li>` : ""}
<li><strong>Time:</strong> ${timestamp}</li>
</ul>
<p>Verification will be performed by the Steward. This does not verify a Contribution or advance exchange state.</p>
<p>— SigRank Exchange</p>
</div>`,
      };
    }

    case "attempt_verified":
    case "exchange_attempt_verified": {
      return {
        subject: `[SigRank] Attempt verified — ${resourceLabel}`,
        text: [
          `Your attempt has been verified.`,
          ``,
          `Signal: ${ctx.resourceId}`,
          `Time: ${timestamp}`,
          ``,
          `You may now create a proposal from this attempt if the signal allows follow-on.`,
          ``,
          `— SigRank Exchange`,
        ].join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>Your attempt has been verified.</p>
<ul><li><strong>Signal:</strong> ${ctx.resourceId}</li><li><strong>Time:</strong> ${timestamp}</li></ul>
<p>You may now create a proposal from this attempt if the signal allows follow-on.</p>
<p>— SigRank Exchange</p>
</div>`,
      };
    }

    case "attempt_rejected":
    case "exchange_attempt_rejected": {
      const reason = ctx.details?.reason as string | undefined;
      return {
        subject: `[SigRank] Attempt rejected — ${resourceLabel}`,
        text: [
          `Your attempt was rejected.`,
          ``,
          `Signal: ${ctx.resourceId}`,
          reason ? `Reason: ${reason}` : "",
          `Time: ${timestamp}`,
          ``,
          `— SigRank Exchange`,
        ].filter(Boolean).join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>Your attempt was rejected.</p>
<ul>
<li><strong>Signal:</strong> ${ctx.resourceId}</li>
${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ""}
<li><strong>Time:</strong> ${timestamp}</li>
</ul>
<p>— SigRank Exchange</p>
</div>`,
      };
    }

    case "proposal_created":
    case "exchange_proposal_created": {
      const proposalId = ctx.details?.proposal_id as string | undefined;
      return {
        subject: `[SigRank] Proposal created — ${proposalId ?? ctx.resourceId}`,
        text: [
          `Your proposal has been created.`,
          ``,
          `Proposal: ${proposalId ?? ctx.resourceId}`,
          `Time: ${timestamp}`,
          ``,
          `The proposal is now pending review.`,
          ``,
          `— SigRank Exchange`,
        ].join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>Your proposal has been created.</p>
<ul><li><strong>Proposal:</strong> ${proposalId ?? ctx.resourceId}</li><li><strong>Time:</strong> ${timestamp}</li></ul>
<p>The proposal is now pending review.</p>
<p>— SigRank Exchange</p>
</div>`,
      };
    }

    case "execution_receipt_submitted": {
      const executionId = ctx.details?.execution_id as string | undefined;
      const status = ctx.details?.execution_status as string | undefined;
      return {
        subject: `[SigRank] Execution receipt — ${executionId ?? ctx.resourceId}`,
        text: [
          `An execution receipt has been submitted.`,
          ``,
          `Exchange: ${ctx.resourceId}`,
          executionId ? `Execution: ${executionId}` : "",
          status ? `Status: ${status}` : "",
          `Time: ${timestamp}`,
          ``,
          `— SigRank Exchange`,
        ].filter(Boolean).join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>An execution receipt has been submitted.</p>
<ul>
<li><strong>Exchange:</strong> ${ctx.resourceId}</li>
${executionId ? `<li><strong>Execution:</strong> ${executionId}</li>` : ""}
${status ? `<li><strong>Status:</strong> ${status}</li>` : ""}
<li><strong>Time:</strong> ${timestamp}</li>
</ul>
<p>— SigRank Exchange</p>
</div>`,
      };
    }

    default: {
      // Generic notification for any unhandled event type
      return {
        subject: `[SigRank] ${ctx.eventType} — ${resourceLabel}`,
        text: [
          `Exchange event: ${ctx.eventType}`,
          ``,
          `${ctx.resourceType}: ${ctx.resourceId}`,
          `Time: ${timestamp}`,
          ``,
          `— SigRank Exchange`,
        ].join("\n"),
        html: `<div style="font-family:monospace;font-size:14px">
<p>Exchange event: ${ctx.eventType}</p>
<ul><li><strong>${ctx.resourceType}:</strong> ${ctx.resourceId}</li><li><strong>Time:</strong> ${timestamp}</li></ul>
<p>— SigRank Exchange</p>
</div>`,
      };
    }
  }
}
