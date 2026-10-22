# SignalAF owner-only outbound email

This feature reuses the existing production \`RESEND_API_KEY\` and the verified sender \`hello@signalaf.com\`. It **does not** change the existing public/no-auth SignalAF MCP or contact form.

## Endpoint and authorization

\`POST /api/v1/owner/send-email\`

Requests must authenticate as the one Supabase auth user whose ID is configured in the **server-only** \`SIGNALAF_MAIL_OWNER_USER_ID\` environment variable.

- Machine clients: \`Authorization: Bearer <verified Supabase user access JWT>\`. The Supabase Auth service validates the token on every request. A Supabase anon key or arbitrary static API token is **not** sufficient.
- Browser clients: existing SignalAF auth session cookies plus a matching same-origin \`Origin\` header.
- Requests without owner authentication fail closed. The API key stays on the server and cannot be supplied or overridden by callers.
- The public SignalAF MCP remains unauthenticated and has **no** \`send_email\` tool. Do not add this action to \`lib/mcp/plugin/contracts.json\`.

The SignalAF Supabase project does **not** have a \`public.profiles\` role table. Do not reuse the older exchange-observability role check for privileged sending; the server-managed owner user-ID allowlist is intentional.

## Input contract

\`\`\`json
{
  "to": "recipient@example.com",
  "subject": "Your SignalAF operator card",
  "text": "Here is your personal SignalAF card.",
  "confirmSend": true,
  "idempotencyKey": "operatorCard20261022_01"
}
\`\`\`

One optional \`attachment\` object may be supplied for a PNG card:

\`\`\`json
"attachment": {
  "filename": "signalaf-card.png",
  "contentBase64": "<base64 of PNG bytes>"
}
\`\`\`

The implementation enforces a single recipient, fixed sender and Reply-To, body/subject bounds, PNG file signature and 2 MiB limit, a 3 MiB JSON request limit, a 20-send/hour owner cap and 60-send/day global cap. Both caps use the existing durable distributed limiter with fail-closed behavior. A stable \`idempotencyKey\` is forwarded to Resend, preventing duplicate delivery on retries within Resend's retention window. Provider receipts and non-content audit metadata are logged; no raw tokens, subjects, attachments, or email bodies are logged.

Resend returning a message ID means **accepted for delivery**, not necessarily delivered to the inbox. Inspect Resend delivery events or the recipient inbox separately.

## Self-test, after review and deployment

Create a verified Supabase session first. Keep your access JWT in a secure, short-lived environment variable; **never paste it into ChatGPT or logs**.

\`\`\`bash
curl -sS -X POST 'https://signalaf.com/api/v1/owner/send-email' \
  -H "Authorization: Bearer $SIGNALAF_OWNER_ACCESS_JWT" \
  -H 'Content-Type: application/json' \
  --data '{"to":"deric.mchenry@gmail.com","subject":"SignalAF owner send test","text":"Testing the verified owner-only sender.","confirmSend":true,"idempotencyKey":"selftest20261022_01"}'
\`\`\`

A successful response has \`status: "accepted"\`, \`from: "hello@signalaf.com"\`, and a Resend \`providerId\`. Verify the recipient inbox and headers separately.

For a same-origin browser console smoke test, sign into \`https://signalaf.com\` as the configured owner first, then make a \`fetch\` POST to the same endpoint with \`credentials: "same-origin"\` and the same JSON payload. Do not rely on test/simulated auth for production acceptance.

**Deployment caution:** as of October 22, 2026, Vercel \`RESEND_API_KEY\` was present in **production** only. Preview and local builds should fail with 503 rather than send until a preview-specific provider key is explicitly provisioned. The new owner user ID is configured on the existing Vercel project.

## ChatGPT integration status

The backend endpoint alone does **not** create a ChatGPT action. A **private** ChatGPT connection must be configured with delegated user authentication so its calls carry the owner's verified JWT. Do not put static Resend credentials in tool parameters or publish a no-auth tool. Because this sender is a high-impact action, require explicit user review before each send, particularly for promotional campaigns.

Before production rollout:
1. Run \`npx vitest run __tests__/mcp/owner-mail-route.test.ts\`, \`npx tsc --noEmit\`, and the existing MCP regression tests.
2. Manually review auth/CSRF, owner-ID configuration and outbound content restrictions.
3. Approve the PR/deployment gate, test one self-addressed email, check Resend delivery receipt, and only then authorize operator outreach.
