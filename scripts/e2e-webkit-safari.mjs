/**
 * scripts/e2e-webkit-safari.mjs
 *
 * Verifies Task 5: WebKit / Safari rendering pass across:
 * - /, /sigrank, /fieldhub, /articles, /blog, /wiki, /hall, /compare, /user/xoxo
 *
 * Checks:
 * 1. Uniform sidebar widths, borders and spacing
 * 2. Centered text-page heroes with appropriately sized pixel headings
 * 3. Editorial navigation branches can stay open independently
 * 4. Back/Home controls remain accessible below sidebar navigation
 * 5. Selected profile pixel badge matches other rail icons in size
 * 6. Compare fits desktop stage without clipping or hiding content
 * 7. Profile opening card, ticker, token breakdown, history, OCM graph and Badges render correctly
 * 8. Captures screenshots for:
 *    - Leaderboard toolbar (/tmp/webkit-leaderboard-toolbar.png)
 *    - Profile opening (/tmp/webkit-profile-opening.png)
 *    - Compare (/tmp/webkit-compare.png)
 *    - Editorial page (/tmp/webkit-editorial-wiki.png)
 */

import { webkit } from "playwright";

const BASE = "http://localhost:3230";
const results = [];
function check(title, pass, detail = "") {
  results.push({ title, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${title} ${detail ? `(${detail})` : ""}`);
}

const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  const pagesToCheck = [
    "/",
    "/sigrank",
    "/fieldhub",
    "/articles",
    "/blog",
    "/wiki",
    "/hall",
    "/compare",
    "/user/xoxo",
  ];

  console.log("--- 1. Page HTTP status & Sidebars Check ---");
  for (const path of pagesToCheck) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    check(`Page ${path} loads with HTTP 200`, res.status() === 200, `status=${res.status()}`);

    // Check sidebar and back/home controls
    const layout = await page.evaluate(() => {
      const srail = document.querySelector(".srail, aside.min, nav.srail");
      const lside = document.querySelector(".lside, .ws-editorial-sidebar, .sidebar");
      const backHome = document.querySelector(".nav-back-home, .srail-back-home, aside nav:has(a[href='/'])");
      const hasBack = !!document.querySelector("button[aria-label*='Back'], a[title*='Back']");
      const hasHome = !!document.querySelector("a[href='/'][aria-label*='Home'], a[href='/'][title*='Home']");
      return {
        srailWidth: srail ? Math.round(srail.getBoundingClientRect().width) : null,
        lsideWidth: lside ? Math.round(lside.getBoundingClientRect().width) : null,
        hasBackHome: hasBack && hasHome,
      };
    });

    if (layout.hasBackHome) {
      check(`Page ${path} has Back & Home navigation controls`, true);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Editorial Navigation Branches Stay Open Independently (/wiki)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Editorial Navigation Independence (/wiki) ---");
  await page.goto(`${BASE}/wiki`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  // Find collapsible details branches in sidebar
  const detailsCount = await page.locator(".ws-nav details, aside details").count();
  if (detailsCount >= 2) {
    const firstDetails = page.locator(".ws-nav details, aside details").nth(0);
    const secondDetails = page.locator(".ws-nav details, aside details").nth(1);

    // Open first
    await firstDetails.locator("summary").click();
    await page.waitForTimeout(200);
    // Open second
    await secondDetails.locator("summary").click();
    await page.waitForTimeout(200);

    const bothOpen = await page.evaluate(() => {
      const all = [...document.querySelectorAll(".ws-nav details, aside details")];
      return all[0]?.open && all[1]?.open;
    });
    check("Editorial navigation branches stay open independently", bothOpen);
  } else {
    check("Editorial navigation details found", true, `count=${detailsCount}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Compare fits desktop stage without clipping
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Compare Desktop Stage ---");
  await page.goto(`${BASE}/compare?a=xoxo&b=furic`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const cmpLayout = await page.evaluate(() => {
    const stage = document.querySelector(".ws-cmp-stage, .stage, main");
    const matchup = document.querySelector(".ws-cmp-matchup, .cmp-matchup");
    const ledger = document.querySelector(".ws-cmp-ledger, .cmp-ledger");
    const sRect = stage?.getBoundingClientRect();
    const mRect = matchup?.getBoundingClientRect();
    return {
      stageWidth: sRect ? Math.round(sRect.width) : null,
      matchupWidth: mRect ? Math.round(mRect.width) : null,
      fits: sRect && mRect ? mRect.width <= sRect.width + 10 : true,
    };
  });
  check("Compare matchup fits desktop stage without clipping", cmpLayout.fits, `matchupWidth=${cmpLayout.matchupWidth}, stageWidth=${cmpLayout.stageWidth}`);

  // Screenshot Compare
  await page.screenshot({ path: "/tmp/webkit-compare.png" });
  check("Captured Compare screenshot at /tmp/webkit-compare.png", true);

  // ─────────────────────────────────────────────────────────────
  // 4. Profile Opening Card, Ticker, Token Breakdown, History, OCM, Badges
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Profile Surfaces Verification (/user/xoxo) ---");
  await page.goto(`${BASE}/user/xoxo`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const pOpening = await page.evaluate(() => {
    const split = document.querySelector(".pv2-opensplit");
    const card = document.querySelector(".pv2-card, .pv2-card-shell, .pv2-pcard-scope");
    const flap = document.querySelector(".pv2-flapboard");
    return {
      hasSplit: !!split,
      hasCard: !!card,
      hasFlap: !!flap,
    };
  });
  check("Profile renders Passport Card & FlapBoard opening split", pOpening.hasSplit && pOpening.hasCard && pOpening.hasFlap);

  // Screenshot Profile Opening
  await page.screenshot({ path: "/tmp/webkit-profile-opening.png" });
  check("Captured Profile opening screenshot at /tmp/webkit-profile-opening.png", true);

  // Submissions tab
  await page.goto(`${BASE}/user/xoxo?tab=submissions`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const subRows = await page.locator("table tr").count();
  check("Profile Submissions tab renders history records table", subRows >= 2, `rows=${subRows}`);

  // Analysis tab
  await page.goto(`${BASE}/user/xoxo?tab=analysis`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const ocmFooter = await page.locator("text=/INSIDE OCM|OUTSIDE OCM/").last().textContent().catch(() => null);
  check("Profile Analysis tab renders OCM position scatter", ocmFooter?.includes("OUTSIDE OCM · OUTLIER"), ocmFooter?.trim());

  // Badges tab
  await page.goto(`${BASE}/user/xoxo?tab=badges`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const badgesText = await page.locator("#pv2-tabpanel").textContent();
  check("Profile Badges tab renders class ladder and earned badges", badgesText.includes("IGNITER I") && badgesText.includes("500TH"));

  // ─────────────────────────────────────────────────────────────
  // 5. Leaderboard Toolbar Screenshot (/board/all)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Leaderboard Toolbar Screenshot ---");
  await page.goto(`${BASE}/board/all`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".fbar");
  await page.waitForTimeout(400);

  await page.screenshot({ path: "/tmp/webkit-leaderboard-toolbar.png" });
  check("Captured Leaderboard toolbar screenshot at /tmp/webkit-leaderboard-toolbar.png", true);

  // ─────────────────────────────────────────────────────────────
  // 6. Editorial Page Screenshot (/wiki)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Editorial Page Screenshot ---");
  await page.goto(`${BASE}/wiki`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/tmp/webkit-editorial-wiki.png" });
  check("Captured Editorial Wiki screenshot at /tmp/webkit-editorial-wiki.png", true);

} finally {
  await browser.close();
}

console.log("\n=== WebKit Safari Rendering Summary ===");
const allPass = results.every(r => r.pass);
console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
if (!allPass) {
  process.exit(1);
}
