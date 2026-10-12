/**
 * scripts/e2e-phase3-profile.mjs — Phase 3 user-profile checks (items 7–14).
 *
 * Verifies against the live staging preview:
 *   7  Submission Activity moved into the right rail
 *   8  Records & Honors moved into the right rail with detail
 *   9  Trophy graphics: earned/pending/unavailable states + medal hierarchy
 *   10 Clickable records → dialog with definition/value/cohort/period/date/evidence
 *   11 Holographic shine element present; reduced-motion disables animation
 *   12 Workflow marks: REVIEW (unresolved) / OITL labels render
 *   13 Rank contexts: FIELD (combined) + workflow cohort, board-verified
 *   14 Ticker (FlapBoard) density — no clipped cells
 * Plus: narrow viewport overflow check + pending-profile honest states.
 *
 * Screenshots → release-staging/evidence/phase3-*.png
 */
import { webkit } from "playwright";

const BASE = "http://localhost:3230";
const OUT = "release-staging/evidence";
const results = [];
function check(title, pass, detail = "") {
  results.push({ title, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${title}${detail ? ` (${detail})` : ""}`);
}

const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  /* ── xoxo: claimed, board #3, unresolved mode → AUTO cohort ── */
  await page.goto(`${BASE}/user/xoxo`, { waitUntil: "networkidle" });
  await page.waitForSelector(".prl-ctx", { timeout: 15000 });

  const rail = await page.evaluate(() => {
    const railEl = document.querySelector("aside.railcol");
    const main = document.querySelector("main.stage");
    const railBox = railEl?.getBoundingClientRect();
    const mainBox = main?.getBoundingClientRect();
    const ctx = [...document.querySelectorAll(".prl-ctx-row")].map((r) => r.textContent.trim());
    const note = document.querySelector(".prl-ctx-note")?.textContent.trim() ?? null;
    const wf = [...document.querySelectorAll(".prl-ctx-mark .wfm-txt, .wfm-txt")].map((e) => e.textContent.trim());
    const recButtons = [...document.querySelectorAll(".prl-rec")];
    const recStates = recButtons.map((b) => b.className.match(/prl-rec--(\w+)/)?.[1]);
    const medals = [...document.querySelectorAll(".prl-medal")].map((m) => m.textContent.trim());
    const heatCells = document.querySelectorAll(".prl-heat-cell").length;
    const actMod = [...document.querySelectorAll(".mod h3")].find((h) => h.textContent.includes("SUBMISSION ACTIVITY"));
    const actInRail = !!actMod && !!railEl?.contains(actMod);
    const recMod = [...document.querySelectorAll(".mod h3")].find((h) => h.textContent.includes("RECORDS"));
    const recInRail = !!recMod && !!railEl?.contains(recMod);
    const ctxMod = [...document.querySelectorAll(".mod h3")].find((h) => h.textContent.includes("RANK CONTEXTS"));
    const ctxInRail = !!ctxMod && !!railEl?.contains(ctxMod);
    const shine = document.querySelector(".pv2-shine");
    const shineAnim = shine ? getComputedStyle(shine).animationName : null;
    const heroRank = document.querySelector(".pv2-hrank")?.textContent ?? "";
    // main content must NOT contain heatmap/records any more
    const mainHasHeat = main ? !!main.querySelector(".prl-heat") : null;
    const mainHasRecs = main ? !!main.querySelector(".prl-recs") : null;
    return { railBox, mainBox, ctx, note, wf, recStates, medals, heatCells, actInRail, recInRail, ctxInRail, shineAnim, heroRank, mainHasHeat, mainHasRecs, recCount: recButtons.length };
  });

  check("rail is right of main", rail.railBox && rail.mainBox && rail.railBox.x > rail.mainBox.x + rail.mainBox.width - 40, `rail.x=${rail.railBox?.x.toFixed(0)} main.right=${rail.mainBox?.right.toFixed(0)}`);
  check("rank contexts in rail", rail.ctxInRail === true);
  check("FIELD row present", rail.ctx[0]?.startsWith("FIELD#3"), rail.ctx[0]);
  check("AUTO cohort row present", rail.ctx[1]?.startsWith("AUTO#3"), rail.ctx[1]);
  check("review-candidate honesty note", rail.note === "REVIEW CANDIDATE — NOT VERIFIED AUTOMATION", rail.note);
  check("workflow mark label", rail.wf.some((w) => /REVIEW|AUTO/.test(w)), rail.wf.join(","));
  check("activity in rail not main", rail.actInRail === true && rail.mainHasHeat === false, `cells=${rail.heatCells}`);
  check("records in rail not main", rail.recInRail === true && rail.mainHasRecs === false, `rows=${rail.recCount}`);
  check("record states earned+pending", rail.recStates.includes("earned") && rail.recStates.includes("pending"), rail.recStates.join(","));
  check("medals render", rail.medals.length === 3 && rail.medals.some((m) => /gold/.test(m)), rail.medals.join("|"));
  check("holo shine animates", rail.shineAnim && rail.shineAnim !== "none", rail.shineAnim);
  check("hero shows field rank #3", /#\s*3/.test(rail.heroRank), rail.heroRank.replace(/\s+/g, " ").slice(0, 40));
  check("hero percentile 90.5", /90\.5\s*%ile/.test(rail.heroRank), rail.heroRank.replace(/\s+/g, " ").slice(0, 60));

  /* ── record dialog (item 10) ── */
  await page.locator(".prl-rec").first().click();
  await page.waitForSelector(".prl-dialog[open]", { timeout: 5000 });
  const dlg = await page.evaluate(() => {
    const d = document.querySelector(".prl-dialog[open]");
    if (!d) return null;
    const fields = [...d.querySelectorAll("dt")].map((t) => t.textContent.trim());
    const title = d.querySelector(".prl-dialog-titles strong")?.textContent;
    const evidence = d.querySelector(".prl-dialog-dl a")?.href ?? null;
    return { fields, title, evidence };
  });
  check("record dialog opens", !!dlg, dlg?.title);
  check("dialog has definition/value/cohort/period/date", !!dlg && ["DEFINITION", "VALUE", "COHORT", "PERIOD", "DATE"].every((f) => dlg.fields.includes(f)), dlg?.fields.join(","));
  check("dialog evidence link", !!dlg?.evidence, dlg?.evidence);
  await page.keyboard.press("Escape");
  check("dialog closes on Esc", (await page.locator(".prl-dialog[open]").count()) === 0);

  /* ── pending record row dialog ── */
  const pendBtn = page.locator(".prl-rec--pending").first();
  if (await pendBtn.count()) {
    await pendBtn.click();
    const p = await page.evaluate(() => ({
      fields: [...document.querySelectorAll(".prl-dialog[open] dt")].map((t) => t.textContent),
      prog: [...document.querySelectorAll(".prl-dialog[open] dd")].map((t) => t.textContent).find((t) => /SNAPSHOTS|%/.test(t)),
    }));
    check("pending record dialog + progress", p.fields.includes("PROGRESS"), p.prog);
    await page.keyboard.press("Escape");
  }

  await page.screenshot({ path: `${OUT}/phase3-profile-rail.png`, fullPage: false });
  const railEl = page.locator(".mod").first();
  await railEl.scrollIntoViewIfNeeded();

  /* ── FlapBoard density / no clipping (item 14) ── */
  const clip = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll(".flapboard .cell, .flap-cell, [class*='flap']").forEach((e) => {
      if (e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 4) bad.push(e.className + ":" + e.textContent.slice(0, 14));
    });
    return bad;
  });
  check("flap board no clipped cells", clip.length === 0, clip.slice(0, 3).join(";"));

  /* ── reduced motion (item 11) ── */
  const rm = await page.evaluate(() => {
    // emulate prefers-reduced-motion via matchMedia check on the shine rule
    return new Promise((res) => {
      // Reduced-motion coverage can't be re-evaluated without reload — inspect
      // the stylesheet rules directly for a media block covering the shine/card.
      let found = null;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.media && /prefers-reduced-motion/.test(rule.media.mediaText)) {
              for (const inner of rule.cssRules) {
                if (/pv2-shine|pv2-card/.test(inner.selectorText)) found = (found ?? "") + inner.selectorText + " ";
              }
            }
          }
        } catch { /* cross-origin sheet */ }
      }
      res(found);
    });
  });
  check("reduced-motion rule covers shine/card", !!rm && /pv2-shine|pv2-card/.test(rm), rm);

  /* ── OITL operator (item 12/13) ── */
  await page.goto(`${BASE}/user/zachlagden`, { waitUntil: "networkidle" });
  await page.waitForSelector(".prl-ctx", { timeout: 15000 });
  const oitl = await page.evaluate(() => ({
    ctx: [...document.querySelectorAll(".prl-ctx-row")].map((r) => r.textContent.trim()),
    wf: [...document.querySelectorAll(".wfm-txt")].map((e) => e.textContent.trim()),
  }));
  check("OITL cohort row", oitl.ctx[1]?.startsWith("OITL#"), oitl.ctx[1]);
  check("OITL mark label", oitl.wf.some((w) => /OITL|OPERATOR-IN-THE-LOOP/.test(w)), oitl.wf.join(","));
  check("OITL field rank", /^FIELD#\d+/.test(oitl.ctx[0] ?? ""), oitl.ctx[0]);
  await page.screenshot({ path: `${OUT}/phase3-profile-oitl.png`, fullPage: false });

  /* ── pending profile (sex): honest empty states ── */
  await page.goto(`${BASE}/user/sex`, { waitUntil: "networkidle" });
  await page.waitForSelector(".prl-ctx", { timeout: 15000 });
  const pend = await page.evaluate(() => ({
    ctx: [...document.querySelectorAll(".prl-ctx-row")].map((r) => r.textContent.trim()),
    note: document.querySelector(".prl-ctx-note")?.textContent.trim(),
    recs: [...document.querySelectorAll(".prl-rec")].map((b) => b.className.match(/prl-rec--(\w+)/)?.[1]),
    medalsZero: [...document.querySelectorAll(".prl-medal b")].map((b) => b.textContent),
  }));
  check("pending: FIELD UNRANKED", pend.ctx[0]?.includes("UNRANKED"), pend.ctx[0]);
  check("pending: awaiting snapshot note", pend.note === "AWAITING FIRST SCORED SNAPSHOT", pend.note);
  check("pending: only pending milestone record", pend.recs.length === 1 && pend.recs[0] === "pending", pend.recs.join(","));
  check("pending: medals all zero", pend.medalsZero.every((n) => n === "0"), pend.medalsZero.join(","));
  await page.screenshot({ path: `${OUT}/phase3-profile-pending.png`, fullPage: false });

  /* ── narrow viewport (item 14 + rail responsiveness) ── */
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto(`${BASE}/user/xoxo`, { waitUntil: "networkidle" });
  await page.waitForSelector(".prl-ctx", { timeout: 15000 });
  const narrow = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    railWidth: document.querySelector(".prl-ctx")?.getBoundingClientRect().width,
    recOk: [...document.querySelectorAll(".prl-rec")].every((b) => b.scrollWidth <= b.clientWidth + 4),
  }));
  check("820px: no horizontal overflow", narrow.overflowX === false, `scrollW vs clientW`);
  check("820px: record rows not clipped", narrow.recOk === true);
  await page.screenshot({ path: `${OUT}/phase3-profile-narrow.png`, fullPage: true });
} catch (err) {
  check("fatal error", false, String(err).slice(0, 300));
} finally {
  await browser.close();
}

const fails = results.filter((r) => !r.pass);
console.log(`\n${results.length - fails.length}/${results.length} PASS`);
process.exit(fails.length ? 1 : 0);
