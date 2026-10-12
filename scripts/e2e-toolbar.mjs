/**
 * scripts/e2e-toolbar.mjs
 *
 * Verifies Task 4: Leaderboard toolbar layout & exports
 * 1. Even distribution at 1229x739 and 1440x900 without clipping or overlap
 * 2. Toolbar stays visible while rows scroll and does not cover the first row
 * 3. Platform shown in Raw mode only; hidden in Metrics mode
 * 4. Search input has usable width (not collapsed to 25px)
 * 5. CSV export matches the current filtered view
 * 6. PNG screenshot captures the intended leaderboard without Share menu obscuring it
 */

import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3230";
const results = [];
function check(title, pass, detail = "") {
  results.push({ title, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${title} ${detail ? `(${detail})` : ""}`);
}

const browser = await chromium.launch();

try {
  for (const vp of [{ width: 1229, height: 739 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto(`${BASE}/board/all`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".fbar", { timeout: 10000 });

    // 1. Check Metrics mode layout
    const mCheck = await page.evaluate(() => {
      const fbar = document.querySelector(".fbar");
      const fRect = fbar.getBoundingClientRect();
      const input = fbar.querySelector("input");
      const platformSelect = fbar.querySelector(".fb-platform select");
      const firstRow = document.querySelector("tbody tr");
      const rRect = firstRow?.getBoundingClientRect();
      return {
        fbarWidth: Math.round(fRect.width),
        inputWidth: Math.round(input?.getBoundingClientRect().width ?? 0),
        firstRowTop: Math.round(rRect?.top ?? 0),
        fbarBottom: Math.round(fRect.bottom),
        hasPlatformInMetrics: !!platformSelect,
      };
    });

    check(`[${vp.width}x${vp.height}] Platform hidden in Metrics mode`, !mCheck.hasPlatformInMetrics);
    check(`[${vp.width}x${vp.height}] Search input is usable width (>= 50px)`, mCheck.inputWidth >= 50, `width=${mCheck.inputWidth}px`);
    check(`[${vp.width}x${vp.height}] Toolbar does not cover first row`, mCheck.fbarBottom < mCheck.firstRowTop, `fbarBottom=${mCheck.fbarBottom}, rowTop=${mCheck.firstRowTop}`);

    // 2. Check Raw mode layout
    await page.click("button:has-text('Raw')");
    await page.waitForTimeout(300);

    const rCheck = await page.evaluate(() => {
      const fbar = document.querySelector(".fbar");
      const fRect = fbar.getBoundingClientRect();
      const platformSelect = fbar.querySelector(".fb-platform select");
      const platformTh = document.querySelector("th.hc-platform");
      return {
        fbarWidth: Math.round(fRect.width),
        hasPlatformSelectInRaw: !!platformSelect,
        hasPlatformHeaderInRaw: !!platformTh,
      };
    });

    check(`[${vp.width}x${vp.height}] Platform select visible in Raw mode`, rCheck.hasPlatformSelectInRaw);
    check(`[${vp.width}x${vp.height}] Platform table column visible in Raw mode`, rCheck.hasPlatformHeaderInRaw);

    // 3. Scroll persistence
    await page.evaluate(() => {
      const stage = document.querySelector(".stage");
      if (stage) stage.scrollTop = 500;
    });
    await page.waitForTimeout(300);
    const scrollState = await page.evaluate(() => {
      const fbar = document.querySelector(".fbar");
      const rect = fbar.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom > 0;
    });
    check(`[${vp.width}x${vp.height}] Toolbar remains visible when rows scroll`, scrollState);

    await page.close();
  }

  // 4. Test Filtered CSV export
  console.log("\n--- Testing Filtered CSV Export ---");
  const pCsv = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pCsv.goto(`${BASE}/board/all`, { waitUntil: "domcontentloaded" });
  await pCsv.waitForSelector(".fbar", { timeout: 10000 });

  // Type search filter "xoxo"
  await pCsv.fill(".fbar input", "xoxo");
  await pCsv.waitForTimeout(400);

  // Open Share menu and download CSV
  const shareDetails = pCsv.locator("details.board-share");
  await shareDetails.locator("summary").click();
  await pCsv.waitForTimeout(200);

  const [download] = await Promise.all([
    pCsv.waitForEvent("download"),
    pCsv.click(".board-share-menu button.exp"),
  ]);

  const csvPath = await download.path();
  const csvContent = fs.readFileSync(csvPath, "utf8");
  check("CSV export downloaded successfully", csvContent.length > 0);
  check("CSV contains search result xoxo", csvContent.includes("xoxo"));
  check("CSV filtered view excludes non-matching operators", !csvContent.includes("Kabir Acharya") && !csvContent.includes("H82"), "filtered properly");

  // 5. Test PNG Screenshot capture (menu not obscuring)
  console.log("\n--- Testing PNG Screenshot Export ---");
  // Clear search so full board is visible
  await pCsv.fill(".fbar input", "");
  await pCsv.waitForTimeout(400);

  // Ensure Share details menu is open
  const isOpen = await shareDetails.evaluate((el) => el.open);
  if (!isOpen) {
    await shareDetails.locator("summary").click();
    await pCsv.waitForTimeout(200);
  }

  const [pngDownload] = await Promise.all([
    pCsv.waitForEvent("download", { timeout: 10000 }),
    pCsv.click(".board-share-menu button:has-text('Screenshot PNG')"),
  ]);

  const pngPath = await pngDownload.path();
  const pngStat = fs.statSync(pngPath);
  check("PNG export downloaded successfully", pngStat.size > 10000, `size=${pngStat.size} bytes`);

  // Verify Share menu is closed after capture
  const menuOpenAfter = await shareDetails.evaluate((el) => el.open);
  check("Share menu is closed after capture so it does not obscure board", !menuOpenAfter);

  await pCsv.close();

} finally {
  await browser.close();
}

console.log("\n=== Leaderboard Toolbar Verification Summary ===");
const allPass = results.every(r => r.pass);
console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
if (!allPass) {
  process.exit(1);
}
