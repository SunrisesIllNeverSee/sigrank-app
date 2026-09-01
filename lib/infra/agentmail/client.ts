/**
 * lib/infra/agentmail/client.ts — AgentMail API client for exchange agent
 * notifications.
 *
 * AgentMail provides API-first email inboxes for AI agents. This client
 * handles:
 * - Creating inboxes for exchange agents (keyed to agent_key_hash)
 * - Sending notifications on exchange state changes
 * - Looking up inbox state
 *
 * No-ops cleanly when AGENTMAIL_API_KEY is unset — the exchange works
 * without email notifications, they're additive.
 *
 * API docs: https://agentmail.to/docs/api-reference
 *
 * ── AgentMail SDK quickstart (reference) ──────────────────────────────
 *
 * This file uses fetch() directly to avoid adding a dependency. The official
 * AgentMail SDKs are available for projects that prefer them:
 *
 * TypeScript SDK:
 *   import { AgentMailClient } from "agentmail";
 *   const client = new AgentMailClient({ apiKey: "YOUR_API_KEY" });
 *   const sentMessage = await client.inboxes.messages.send(
 *     "outreach@agentmail.to",
 *     { to: "recipient@domain.com", subject: "Hello", text: "Body" }
 *   );
 *   const allMessages = await client.inboxes.messages.list("outreach@agentmail.to");
 *
 * Python SDK:
 *   from agentmail import AgentMail
 *   from agentmail.environment import AgentMailEnvironment
 *   client = AgentMail(
 *     environment=AgentMailEnvironment.PROD,
 *     api_key="YOUR_TOKEN_HERE"
 *   )
 *   client.inboxes.threads.list(inbox_id="inbox_id")
 *
 * The fetch-based implementation below mirrors the same API surface:
 *   POST /v0/inboxes                          → createAgentInbox()
 *   POST /v0/inboxes/{id}/messages/send       → sendAgentNotification()
 *   GET  /v0/inboxes                          → getInboxByClientId()
 */

const AGENTMAIL_API_BASE = "https://api.agentmail.to/v0";

function apiKey(): string | null {
  // Vercel marketplace integration applies the custom prefix as-is to the env
  // var name. The owner entered "SIGRANK_" but Vercel lowercased the prefix
  // portion, producing "sigrank_AGENTMAIL_API_KEY". Check all variants:
  // 1. sigrank_AGENTMAIL_API_KEY — what Vercel actually created (lowercase prefix)
  // 2. SIGRANK_AGENTMAIL_API_KEY — if Vercel preserves case in the future
  // 3. AGENTMAIL_API_KEY — unprefixed fallback for local dev / non-Vercel deploys
  return (
    process.env.sigrank_AGENTMAIL_API_KEY ??
    process.env.SIGRANK_AGENTMAIL_API_KEY ??
    process.env.AGENTMAIL_API_KEY ??
    null
  );
}

export interface AgentInbox {
  inbox_id: string;
  email: string;
  display_name?: string;
}

export interface SendMessageResult {
  message_id: string;
  thread_id?: string;
}

/**
 * Create an AgentMail inbox for an exchange agent.
 *
 * The inbox is keyed to the agent's credential hash (not their raw key —
 * we never store or transmit the raw key). The `client_id` enables safe
 * retries: if the same agent_key_hash is used twice, AgentMail returns
 * the existing inbox instead of creating a duplicate.
 */
export async function createAgentInbox(
  agentKeyHash: string,
  displayName?: string,
): Promise<AgentInbox | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch(`${AGENTMAIL_API_BASE}/inboxes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: `sigrank-agent-${agentKeyHash}`,
        display_name: displayName ?? `SigRank Agent ${agentKeyHash.slice(0, 8)}`,
        metadata: {
          source: "sigrank-exchange",
          agent_key_hash: agentKeyHash,
        },
      }),
    });

    if (!res.ok) {
      console.error("[agentmail] Create inbox failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return {
      inbox_id: data.inbox_id,
      email: data.email,
      display_name: data.display_name,
    };
  } catch (err) {
    console.error("[agentmail] Create inbox error:", err);
    return null;
  }
}

/**
 * Send a notification email from an agent's inbox to a recipient.
 *
 * Used for exchange state change notifications:
 * - submission receipts (to the submitting agent)
 * - verification results (to the agent who submitted)
 * - proposal status changes (to the proposer)
 * - exchange state transitions (to all parties)
 *
 * The `from` inbox must already exist (created via createAgentInbox).
 */
export async function sendAgentNotification(
  fromInboxId: string,
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<SendMessageResult | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch(
      `${AGENTMAIL_API_BASE}/inboxes/${encodeURIComponent(fromInboxId)}/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
        to,
        subject,
        text,
        html: html ?? text,
        labels: ["sigrank-exchange"],
      }),
      },
    );

    if (!res.ok) {
      console.error("[agentmail] Send failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return {
      message_id: data.message_id ?? data.id,
      thread_id: data.thread_id,
    };
  } catch (err) {
    console.error("[agentmail] Send error:", err);
    return null;
  }
}

/**
 * Get an inbox by its client_id (the agent_key_hash-derived ID we set
 * during creation). Returns null if the inbox doesn't exist or AgentMail
 * is not configured.
 */
export async function getInboxByClientId(
  agentKeyHash: string,
): Promise<AgentInbox | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    // AgentMail doesn't have a direct lookup-by-client_id endpoint, so we
    // list inboxes and filter. This is fine for low volume; if agent count
    // grows large, we cache the mapping in Supabase (agent_mailboxes table).
    const res = await fetch(`${AGENTMAIL_API_BASE}/inboxes`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const inboxes = data.inboxes ?? data ?? [];
    const found = Array.isArray(inboxes)
      ? inboxes.find((i: any) => i.client_id === `sigrank-agent-${agentKeyHash}`)
      : null;

    if (!found) return null;

    return {
      inbox_id: found.inbox_id,
      email: found.email,
      display_name: found.display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Ensure an agent has an inbox. Creates one if it doesn't exist, returns
 * the existing one if it does. No-ops to null when AgentMail is not
 * configured.
 */
export async function ensureAgentInbox(
  agentKeyHash: string,
  displayName?: string,
): Promise<AgentInbox | null> {
  const existing = await getInboxByClientId(agentKeyHash);
  if (existing) return existing;
  return createAgentInbox(agentKeyHash, displayName);
}
