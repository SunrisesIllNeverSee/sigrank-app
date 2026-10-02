import test from "node:test";
import assert from "node:assert/strict";
import { prepareBetaReport, formatBetaReport } from "../../lib/mcp/plugin/bug-report.ts";

const valid = {
  summary: "30-day board returns the wrong filter",
  steps: ["Open the board", "Select the 30-day window"],
  expected: "The selected cohort appears",
  actual: "An illustrative table appears",
  surface: "ChatGPT",
  consent_confirmed: true,
};

test("beta report keeps reproducible details and redacts credentials", () => {
  const report = prepareBetaReport({
    ...valid,
    actual: "Bearer abc123 was exposed beside user@example.com",
    reply_email: "tester@example.com",
  });
  const body = formatBetaReport(report, "SRB-1234ABCD", "2026-10-01T00:00:00.000Z");
  assert.equal(report.replyEmail, "tester@example.com");
  assert.equal(report.redacted, true);
  assert.match(body, /\[redacted credential\]/);
  assert.match(body, /\[redacted email\]/);
  assert.doesNotMatch(body, /abc123|user@example.com|tester@example.com/);
  assert.match(body, /Select the 30-day window/);
});

test("beta report requires explicit submission approval", () => {
  assert.throws(() => prepareBetaReport({ ...valid, consent_confirmed: false }), /explicitly approve/);
  assert.throws(() => prepareBetaReport({ ...valid, consent_confirmed: undefined }), /explicitly approve/);
});

test("beta report rejects oversized or invalid fields", () => {
  assert.throws(() => prepareBetaReport({ ...valid, steps: Array(6).fill("Repeat step") }), /1–5/);
  assert.throws(() => prepareBetaReport({ ...valid, surface: "Unknown" }), /surface/);
  assert.throws(() => prepareBetaReport({ ...valid, reply_email: "not-an-email" }), /reply_email/);
  assert.throws(() => prepareBetaReport({ ...valid, summary: "short" }), /summary/);
});
