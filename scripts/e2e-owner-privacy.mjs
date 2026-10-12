/**
 * scripts/e2e-owner-privacy.mjs
 *
 * Full live E2E verification of owner privacy and cache updates:
 * 1. Signed-out visitor, signed-in non-owner, and signed-in owner.
 * 2. Owner access to Report.
 * 3. Private/public report visibility toggling and immediate cache invalidation.
 * 4. API responses, rendered profile, and serialized page response payloads.
 * 5. Alternate codename casing verification.
 * 6. Clean restoration/teardown of test accounts.
 */

import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";

const BASE = "http://localhost:3230";

// Read env
const lines = fs.readFileSync(".env.local", "utf8").split("\n");
let url = "", key = "", anonKey = "";
for (const l of lines) {
  if (l.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = l.split("=")[1].trim().replace(/^["\x27]|["\x27]$/g, "");
  if (l.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) key = l.split("=")[1].trim().replace(/^["\x27]|["\x27]$/g, "");
  if (l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) anonKey = l.split("=")[1].trim().replace(/^["\x27]|["\x27]$/g, "");
}

const admin = createClient(url, key);

const timestamp = Date.now();
const ownerCodename = `test-priv-${timestamp}`;
const otherCodename = `test-other-${timestamp}`;
const ownerEmail = `owner-${timestamp}@test.signalaf.internal`;
const visitorEmail = `visitor-${timestamp}@test.signalaf.internal`;
const testPassword = `Pass#${timestamp}!Secure`;
const SECRET_DIAGNOSIS = `CONFIDENTIAL_DIAGNOSIS_${timestamp}`;

let ownerUserId = null;
let visitorUserId = null;
let ownerOpId = null;
let otherOpId = null;

const results = [];
function logCheck(title, pass, detail = "") {
  results.push({ title, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${title} ${detail ? `(${detail})` : ""}`);
}

async function getAuthCookie(email, password) {
  const cookieJar = new Map();
  const ssrClient = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return [...cookieJar.entries()].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) cookieJar.set(name, value);
      },
    },
  });
  const { data, error } = await ssrClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const cookieHeader = [...cookieJar.entries()].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
  const rawCookies = [...cookieJar.entries()].map(([name, value]) => ({ name, value }));
  return { cookieHeader, rawCookies, user: data.user };
}

try {
  console.log("Setting up test operators and auth users...");
  // 1. Create operators
  const { data: op1, error: opErr1 } = await admin.from("operators").insert({
    codename: ownerCodename,
    display_name: `Privacy Test Owner ${timestamp}`,
    claimed: true,
    claimed_at: new Date().toISOString(),
    profile_visibility: "public",
  }).select("operator_id").single();
  if (opErr1) throw opErr1;
  ownerOpId = op1.operator_id;

  const { data: op2, error: opErr2 } = await admin.from("operators").insert({
    codename: otherCodename,
    display_name: `Privacy Test Other ${timestamp}`,
    claimed: true,
    claimed_at: new Date().toISOString(),
    profile_visibility: "public",
  }).select("operator_id").single();
  if (opErr2) throw opErr2;
  otherOpId = op2.operator_id;

  // 2. Add an all_time snapshot for ownerOp so profile renders fully
  await admin.from("metric_snapshots").insert({
    operator_id: ownerOpId,
    snapshot_date: "2026-10-01",
    window_type: "all_time",
    class_tier: "IGNITER I",
    signa_rate: 15.2,
    input_tokens: 1000,
    output_tokens: 2000,
    cache_creation_tokens: 200,
    cache_read_tokens: 3000,
    status: "scored",
  });

  // 3. Create auth users
  const { data: user1, error: uErr1 } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (uErr1) throw uErr1;
  ownerUserId = user1.user.id;

  const { data: user2, error: uErr2 } = await admin.auth.admin.createUser({
    email: visitorEmail,
    password: testPassword,
    email_confirm: true,
  });
  if (uErr2) throw uErr2;
  visitorUserId = user2.user.id;

  // 4. Link operator_accounts
  await admin.from("operator_accounts").insert([
    { user_id: ownerUserId, operator_id: ownerOpId },
    { user_id: visitorUserId, operator_id: otherOpId },
  ]);

  // 5. Insert test report with report_visible: false (initially private)
  await admin.from("operator_reports").insert({
    operator_id: ownerOpId,
    report_visible: false,
    report: {
      current_mode: "hybrid",
      mode_confidence: 0.95,
      mode_distribution: { hitl: 0.3, agentic: 0.7 },
      mode_weighted_yield: 1250,
      peak_yield: 1800,
      health_score: 92,
      diagnosis: SECRET_DIAGNOSIS,
      badges: {
        earned_this_week: ["Badge1"],
        in_progress: [],
        collection: ["Badge1"],
      },
    },
  });

  console.log("Setup complete. Obtaining auth sessions...");
  const ownerAuth = await getAuthCookie(ownerEmail, testPassword);
  const visitorAuth = await getAuthCookie(visitorEmail, testPassword);

  // ─────────────────────────────────────────────────────────────
  // TEST A: Signed-out visitor access to private report
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Signed-out Visitor Access (Report Private) ---");
  const resOutReport = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`);
  logCheck("Signed-out visitor /report API returns 404", resOutReport.status === 404, `status=${resOutReport.status}`);

  const resOutPage = await fetch(`${BASE}/user/${ownerCodename}`);
  const htmlOutPage = await resOutPage.text();
  const leaksSecretOut = htmlOutPage.includes(SECRET_DIAGNOSIS);
  logCheck("Signed-out visitor profile HTML does NOT leak private report", !leaksSecretOut && resOutPage.status === 200);

  // Alternate casing
  const resOutReportUpper = await fetch(`${BASE}/api/v1/operators/${ownerCodename.toUpperCase()}/report`);
  logCheck("Signed-out visitor /report API with UPPERCASE returns 404", resOutReportUpper.status === 404);

  // ─────────────────────────────────────────────────────────────
  // TEST B: Signed-in Non-owner access to private report
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Signed-in Non-owner Access (Report Private) ---");
  const resNonOwnerReport = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`, {
    headers: { Cookie: visitorAuth.cookieHeader },
  });
  logCheck("Signed-in non-owner /report API returns 404", resNonOwnerReport.status === 404, `status=${resNonOwnerReport.status}`);

  const resNonOwnerPage = await fetch(`${BASE}/user/${ownerCodename}`, {
    headers: { Cookie: visitorAuth.cookieHeader },
  });
  const htmlNonOwnerPage = await resNonOwnerPage.text();
  const leaksSecretNonOwner = htmlNonOwnerPage.includes(SECRET_DIAGNOSIS);
  logCheck("Signed-in non-owner profile HTML does NOT leak private report", !leaksSecretNonOwner && resNonOwnerPage.status === 200);

  // ─────────────────────────────────────────────────────────────
  // TEST C: Signed-in Owner access to private report
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Signed-in Owner Access (Report Private) ---");
  const resOwnerReport = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`, {
    headers: { Cookie: ownerAuth.cookieHeader },
  });
  const jsonOwnerReport = await resOwnerReport.json();
  const ownerSeesSecret = jsonOwnerReport?.report?.report?.diagnosis === SECRET_DIAGNOSIS;
  logCheck("Signed-in owner /report API returns 200 with report data", resOwnerReport.status === 200 && ownerSeesSecret);

  // Alternate casing for owner
  const resOwnerReportUpper = await fetch(`${BASE}/api/v1/operators/${ownerCodename.toUpperCase()}/report`, {
    headers: { Cookie: ownerAuth.cookieHeader },
  });
  const jsonOwnerReportUpper = await resOwnerReportUpper.json();
  const ownerSeesSecretUpper = jsonOwnerReportUpper?.report?.report?.diagnosis === SECRET_DIAGNOSIS;
  logCheck("Signed-in owner /report API with UPPERCASE returns 200", resOwnerReportUpper.status === 200 && ownerSeesSecretUpper);

  // ─────────────────────────────────────────────────────────────
  // TEST D: Toggle visibility to PUBLIC and test immediate reflection
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Visibility Toggle to PUBLIC ---");
  const resTogglePublic = await fetch(`${BASE}/api/profile/report-visibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerAuth.cookieHeader,
    },
    body: JSON.stringify({ visible: true }),
  });
  const jsonTogglePublic = await resTogglePublic.json();
  logCheck("Toggle visibility to public returns status: ok", resTogglePublic.status === 200 && jsonTogglePublic.report_visible === true);

  // Immediate check on next request (NO waiting for cache expiry!)
  const resPublicOut = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`);
  const jsonPublicOut = await resPublicOut.json();
  const publicOutHasSecret = jsonPublicOut?.report?.report?.diagnosis === SECRET_DIAGNOSIS;
  logCheck("Signed-out visitor /report API immediately returns 200 when public", resPublicOut.status === 200 && publicOutHasSecret);

  const resPublicOutUpper = await fetch(`${BASE}/api/v1/operators/${ownerCodename.toUpperCase()}/report`);
  const jsonPublicOutUpper = await resPublicOutUpper.json();
  logCheck("Signed-out visitor /report API (UPPERCASE) immediately returns 200 when public", resPublicOutUpper.status === 200 && jsonPublicOutUpper?.report?.report?.diagnosis === SECRET_DIAGNOSIS);

  const resPublicPage = await fetch(`${BASE}/user/${ownerCodename}`);
  const htmlPublicPage = await resPublicPage.text();
  logCheck("Public profile page immediately serializes public report in payload", htmlPublicPage.includes(SECRET_DIAGNOSIS));

  const resPublicPageUpper = await fetch(`${BASE}/user/${ownerCodename.toUpperCase()}`);
  const htmlPublicPageUpper = await resPublicPageUpper.text();
  logCheck("Public profile page (UPPERCASE) immediately serializes public report in payload", htmlPublicPageUpper.includes(SECRET_DIAGNOSIS));

  // ─────────────────────────────────────────────────────────────
  // TEST E: Toggle visibility back to PRIVATE and test immediate reflection
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Visibility Toggle back to PRIVATE ---");
  const resTogglePrivate = await fetch(`${BASE}/api/profile/report-visibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerAuth.cookieHeader,
    },
    body: JSON.stringify({ visible: false }),
  });
  const jsonTogglePrivate = await resTogglePrivate.json();
  logCheck("Toggle visibility to private returns status: ok", resTogglePrivate.status === 200 && jsonTogglePrivate.report_visible === false);

  // Immediate check on next request (NO waiting for cache expiry!)
  const resPrivateOut = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`);
  logCheck("Signed-out visitor /report API immediately returns 404 when private", resPrivateOut.status === 404);

  const resPrivateOutUpper = await fetch(`${BASE}/api/v1/operators/${ownerCodename.toUpperCase()}/report`);
  logCheck("Signed-out visitor /report API (UPPERCASE) immediately returns 404 when private", resPrivateOutUpper.status === 404);

  const resPrivateNonOwner = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`, {
    headers: { Cookie: visitorAuth.cookieHeader },
  });
  logCheck("Signed-in non-owner /report API immediately returns 404 when private", resPrivateNonOwner.status === 404);

  const resPrivatePage = await fetch(`${BASE}/user/${ownerCodename}`);
  const htmlPrivatePage = await resPrivatePage.text();
  logCheck("Profile page immediately removes private report from serialized payload", !htmlPrivatePage.includes(SECRET_DIAGNOSIS));

  // Owner can still access private report immediately
  const resOwnerPrivateReport = await fetch(`${BASE}/api/v1/operators/${ownerCodename}/report`, {
    headers: { Cookie: ownerAuth.cookieHeader },
  });
  const jsonOwnerPrivateReport = await resOwnerPrivateReport.json();
  logCheck("Owner can still access private report via authenticated API", resOwnerPrivateReport.status === 200 && jsonOwnerPrivateReport?.report?.report?.diagnosis === SECRET_DIAGNOSIS);

  // ─────────────────────────────────────────────────────────────
  // TEST F: Browser UI test with Playwright
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Testing Browser UI Rendering (Signed-out vs Owner) ---");
  const browser = await chromium.launch();

  // F.1: Signed-out browser visit
  const outCtx = await browser.newContext();
  const outPage = await outCtx.newPage();
  await outPage.goto(`${BASE}/user/${ownerCodename}?tab=report`, { waitUntil: "networkidle" });
  await outPage.waitForTimeout(1000);

  const outReportPanelText = await outPage.locator("#pv2-tabpanel").textContent();
  const visitorSeesPrivateNotice = outReportPanelText.includes("This report is private — visible to the operator only.");
  const visitorDoesNotSeeSecret = !outReportPanelText.includes(SECRET_DIAGNOSIS);
  logCheck("Signed-out visitor sees 'This report is private' notice", visitorSeesPrivateNotice && visitorDoesNotSeeSecret);

  // F.2: Signed-in owner browser visit
  const ownerCtx = await browser.newContext();
  for (const c of ownerAuth.rawCookies) {
    await ownerCtx.addCookies([
      {
        name: c.name,
        value: c.value,
        url: `${BASE}/`,
      },
    ]);
  }
  const ownerPage = await ownerCtx.newPage();
  await ownerPage.goto(`${BASE}/user/${ownerCodename}?tab=report`, { waitUntil: "networkidle" });
  await ownerPage.waitForTimeout(1000);

  const ownerReportPanelText = await ownerPage.locator("#pv2-tabpanel").textContent();
  const ownerHasReportAccess = (ownerReportPanelText.includes("Make public") || ownerReportPanelText.includes("Make private")) && ownerReportPanelText.includes("Health Score");
  logCheck("Signed-in owner Report tab resolves and renders Report interface with visibility control", ownerHasReportAccess);

  await browser.close();

} finally {
  console.log("\nCleaning up test records from database...");
  if (ownerOpId) {
    await admin.from("operator_reports").delete().eq("operator_id", ownerOpId);
    await admin.from("metric_snapshots").delete().eq("operator_id", ownerOpId);
    await admin.from("operator_accounts").delete().eq("operator_id", ownerOpId);
    await admin.from("operators").delete().eq("operator_id", ownerOpId);
  }
  if (otherOpId) {
    await admin.from("operator_accounts").delete().eq("operator_id", otherOpId);
    await admin.from("operators").delete().eq("operator_id", otherOpId);
  }
  if (ownerUserId) {
    await admin.auth.admin.deleteUser(ownerUserId);
  }
  if (visitorUserId) {
    await admin.auth.admin.deleteUser(visitorUserId);
  }
  console.log("Cleanup finished.");
}

console.log("\n=== Final E2E Privacy Test Summary ===");
const allPass = results.every(r => r.pass);
console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
if (!allPass) {
  process.exit(1);
}
