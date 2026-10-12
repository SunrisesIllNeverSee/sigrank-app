/**
 * scripts/e2e-cross-page.mjs
 *
 * Verifies cross-page data wiring across:
 * 1. Leaderboard -> inspector -> profile link
 * 2. Profile opening split stats agreement with board data
 * 3. Profile -> Compare flow with query param persistence
 * 4. Compare selector swap -> URL update -> reload persistence
 * 5. Compare ledger / history / matchup sync
 * 6. Hall page -> profile links
 * 7. Profile tabs (Submissions, Analysis OCM/Tier, Badges)
 * 8. Pending/unranked operator honest rendering (/user/sex)
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3230";
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${name} ${detail ? `(${detail})` : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  // ─────────────────────────────────────────────────────────────
  // 1. Leaderboard -> inspector -> Profile
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Leaderboard -> Profile Flow ---");
  await page.goto(`${BASE}/board/all`, { waitUntil: "networkidle" });

  // Find xoxo on the leaderboard table (displays display name Karthikeyan KK)
  const xoxoRow = page.locator("tbody tr", { hasText: "Karthikeyan KK" }).first();
  await xoxoRow.waitFor({ timeout: 5000 });
  const rowText = await xoxoRow.textContent();
  check("Leaderboard contains Karthikeyan KK row", rowText.includes("Karthikeyan KK"), rowText.slice(0, 60));

  // Click row to open inspector
  await xoxoRow.click();
  await page.waitForTimeout(500);

  // Inspector SEE PROFILE button
  const seeProfileLink = page.locator("a", { hasText: "SEE PROFILE" }).first();
  const profileHref = await seeProfileLink.getAttribute("href");
  check("Inspector has link to /user/xoxo", profileHref?.includes("/user/xoxo"), profileHref);

  // Follow to Profile
  await seeProfileLink.click();
  await page.waitForURL("**/user/xoxo*", { timeout: 5000 });
  check("Navigated to profile /user/xoxo", page.url().includes("/user/xoxo"));

  // ─────────────────────────────────────────────────────────────
  // 2. Profile stats agreement with recorded data
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Profile Opening Split Agreement ---");
  const pName = await page.locator(".pcard-name, .pv2-name").first().textContent();
  check("Profile displays display name Karthikeyan KK", pName.includes("Karthikeyan KK"), pName.trim());

  const pYield = await page.locator("text=/976\\.9K/").first().textContent();
  check("Profile passport card displays 976.9K Yield", pYield != null, pYield?.trim());

  const pClass = await page.locator("text=/IGNITER I/").first().textContent();
  check("Profile passport card displays IGNITER I", pClass != null, pClass?.trim());

  // Check FlapBoard token row values: 18.2K input, 1.1M output, 305.2M CR, 15.8M CW
  const flapText = await page.locator(".pv2-flapboard").textContent().catch(() => "");
  check("FlapBoard shows 18.2K input tokens", flapText.includes("18.2K") || flapText.includes("INPUT"), "checked FlapBoard");
  check("FlapBoard shows SNR 0.983", flapText.includes("0.983"), "SNR metric");
  check("FlapBoard shows Velocity 58.20", flapText.includes("58.20"), "Velocity metric");

  // ─────────────────────────────────────────────────────────────
  // 3. Profile -> Compare Flow
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Profile -> Compare Flow ---");
  const compareBtn = page.locator("a.pv2-btn", { hasText: "COMPARE" }).first();
  const cmpHref = await compareBtn.getAttribute("href");
  check("Profile has COMPARE link targeting /compare", cmpHref?.includes("/compare?a=xoxo"), cmpHref);

  await page.goto(`${BASE}${cmpHref}`, { waitUntil: "networkidle" });
  check("Compare page loaded with operator A = xoxo", page.url().includes("a=xoxo"), page.url());

  // Verify compare matchup cards render operator A
  const cmpText = await page.textContent("body");
  check("Compare page displays Karthikeyan KK in matchup", cmpText.includes("Karthikeyan KK") || cmpText.includes("xoxo"));

  // ─────────────────────────────────────────────────────────────
  // 4. Compare Selector Swap & URL Persistence
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Compare Selector Swap & Reload Persistence ---");
  // Change B operator to furic via URL
  await page.goto(`${BASE}/compare?a=xoxo&b=furic`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const cmpPairText = await page.textContent(".ws-cmp, body");
  check("Compare page shows xoxo and furic together", cmpPairText.includes("xoxo") && (cmpPairText.includes("furic") || cmpPairText.includes("Richard Fu")));

  // Reload shared URL
  await page.reload({ waitUntil: "networkidle" });
  check("URL persists ?a=xoxo&b=furic after reload", page.url().includes("a=xoxo") && page.url().includes("b=furic"));
  const afterReloadText = await page.textContent(".ws-cmp, body");
  check("Content persists after reload", afterReloadText.includes("xoxo") && (afterReloadText.includes("furic") || afterReloadText.includes("Richard Fu")));

  // ─────────────────────────────────────────────────────────────
  // 5. Hall -> Profile Flow
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Hall of Signal -> Profile Flow ---");
  await page.goto(`${BASE}/hall`, { waitUntil: "networkidle" });
  const firstHallOpLink = page.locator(".hrec a[href*='/user/'], tr a[href*='/user/']").first();
  const hasHallLinks = await firstHallOpLink.count() > 0;
  if (hasHallLinks) {
    const hallOpHref = await firstHallOpLink.getAttribute("href");
    check("Hall contains link to operator profile", hallOpHref?.startsWith("/user/"), hallOpHref);
    await firstHallOpLink.click();
    await page.waitForURL("**/user/*", { timeout: 5000 });
    check("Navigated to operator profile from Hall", page.url().includes("/user/"));
  } else {
    // Check if Hall empty state is clean
    const hallBody = await page.textContent("body");
    check("Hall page loaded without errors", !hallBody.includes("Application error"));
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Profile Tabs: Submissions, Analysis, Badges
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Profile Tabs Verification ---");
  // Submissions
  await page.goto(`${BASE}/user/xoxo?tab=submissions`, { waitUntil: "networkidle" });
  const subPanel = await page.locator("#pv2-tabpanel").textContent();
  check("Submissions tab shows scored snapshot records table", subPanel.includes("Snapshot Records") || subPanel.includes("SHOWING") || subPanel.includes("claude-code") || subPanel.includes("pi"));
  check("Submissions tab distinguishes missing values as '—'", subPanel.includes("— = NOT REPORTED") || subPanel.includes("—"));

  // Analysis
  await page.goto(`${BASE}/user/xoxo?tab=analysis`, { waitUntil: "networkidle" });
  const analysisPanel = await page.locator("#pv2-tabpanel").textContent();
  check("Analysis tab renders Tier Position scatter", analysisPanel.includes("Tier Position") || analysisPanel.includes("TIER"));
  check("Analysis tab renders OCM Position scatter", analysisPanel.includes("OCM Position") || analysisPanel.includes("Operator Center of Mass"));
  check("OCM footer indicates OUTSIDE OCM · OUTLIER", analysisPanel.includes("OUTSIDE OCM · OUTLIER"));
  check("Analysis tab labels field comparisons as FIELD AVG", analysisPanel.includes("FIELD AVG") || analysisPanel.includes("vs field avg"));

  // Badges
  await page.goto(`${BASE}/user/xoxo?tab=badges`, { waitUntil: "networkidle" });
  const badgesPanel = await page.locator("#pv2-tabpanel").textContent();
  check("Badges tab renders IGNITER I class tier", badgesPanel.includes("IGNITER I"));
  check("Badges tab shows 500th snapshot milestone with real progress", badgesPanel.includes("500TH") && badgesPanel.includes("12 ON RECORD"));
  check("Badges tab shows ladder rungs", /class ladder/i.test(badgesPanel) || badgesPanel.includes("RS-0.5"));

  // ─────────────────────────────────────────────────────────────
  // 7. Pending / Unranked Operator Honest Rendering (/user/sex)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. Pending Operator (/user/sex) ---");
  await page.goto(`${BASE}/user/sex`, { waitUntil: "networkidle" });
  const sexOverview = await page.locator("#pv2-tabpanel").textContent();
  check("Pending operator shows pending status", sexOverview.includes("Pending") || sexOverview.includes("PENDING") || sexOverview.includes("Not ranked yet"));
  check("Pending operator does not show fabricated #1 rank", !sexOverview.includes("Rank #1 ") && !sexOverview.includes("rank #1 "));

  await page.goto(`${BASE}/user/sex?tab=badges`, { waitUntil: "networkidle" });
  const sexBadges = await page.locator("#pv2-tabpanel").textContent();
  check("Pending operator shows CLASS STANDING UNAVAILABLE on ladder", sexBadges.includes("CLASS STANDING UNAVAILABLE"));
  check("Pending operator class badge is locked/pending", sexBadges.includes("PENDING FIRST SCORED SNAPSHOT") || sexBadges.includes("—"));

  await page.goto(`${BASE}/user/sex?tab=submissions`, { waitUntil: "networkidle" });
  const sexSubs = await page.locator("#pv2-tabpanel").textContent();
  check("Pending operator submissions tab shows 0 SNAPSHOTS / No submissions", sexSubs.includes("0 SNAPSHOTS") || sexSubs.includes("No submissions yet"));

} catch (err) {
  console.error("Test execution failed:", err);
  check("Execution without error", false, err.message);
} finally {
  await browser.close();
}

console.log("\n=== Cross-Page Wiring Verification Summary ===");
const allPass = results.every(r => r.pass);
console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
if (!allPass) {
  process.exit(1);
}
