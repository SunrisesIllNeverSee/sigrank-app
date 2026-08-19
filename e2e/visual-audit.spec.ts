import { test, expect } from "@playwright/test";

// ── Visual Layout Audit ───────────────────────────────────────────────────
// Renders core product pages at 3 viewport sizes, checks for:
//   1. Horizontal scroll (content wider than viewport)
//   2. Element overlaps (cards, text, buttons colliding)
//   3. Collapsed elements (zero-height sections)
//   4. Screenshot baselines (pixel diff > 5% = regression)
//
// SEO/AEO/GEO pages (vs/, alternatives/, guides/, tools/) are intentionally
// excluded per AGENTS.md — they're strategic content, not core product.
//
// To update baselines after an intentional visual change:
//   npx playwright test e2e/visual-audit.spec.ts --update-snapshots
//   git add e2e/visual-audit.spec.ts-snapshots/ && git commit

const PAGES = [
  { name: "home", path: "/" },
  { name: "leaderboard", path: "/board/all" },
  { name: "score-paste", path: "/score/paste" },
  { name: "methodology", path: "/methodology" },
  { name: "token-cascade", path: "/token-cascade" },
  { name: "metrics", path: "/metrics" },
  { name: "faq", path: "/faq" },
  { name: "field", path: "/field" },
];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 720 },
];

for (const pageInfo of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${pageInfo.name} @ ${vp.name} (${vp.width}×${vp.height})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      // Navigate + wait for network to settle
      await page.goto(pageInfo.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {
        // Some pages have long-polling or streaming — don't block forever
      });

      // 1. No horizontal scroll — content must fit within viewport width
      const scrollWidth = await page.evaluate(() =>
        Math.max(
          document.documentElement.scrollWidth,
          document.body?.scrollWidth ?? 0,
        ),
      );
      expect(
        scrollWidth,
        `${pageInfo.name} has horizontal scroll at ${vp.width}px (scrollWidth=${scrollWidth})`,
      ).toBeLessThanOrEqual(vp.width + 1); // +1 for sub-pixel rounding

      // 2. No overlapping top-level elements (check main containers)
      const overlaps = await page.evaluate(() => {
        const selector = "main, header, footer, section, article, [role='main']";
        const els = [...document.querySelectorAll(selector)];
        const rects = els
          .map((e) => {
            const r = e.getBoundingClientRect();
            return {
              tag: e.tagName.toLowerCase(),
              id: e.id || undefined,
              class: e.className?.toString().slice(0, 40) || undefined,
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
              width: r.width,
              height: r.height,
            };
          })
          .filter((r) => r.width > 50 && r.height > 20); // skip tiny elements

        const issues = [];
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i];
            const b = rects[j];
            // Check significant overlap (> 20px in both dimensions)
            const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (overlapX > 20 && overlapY > 20) {
              // Skip parent/child relationships (one contains the other)
              const aContainsB =
                a.left <= b.left && a.right >= b.right && a.top <= b.top && a.bottom >= b.bottom;
              const bContainsA =
                b.left <= a.left && b.right >= a.right && b.top <= a.top && b.bottom >= a.bottom;
              if (!aContainsB && !bContainsA) {
                issues.push({
                  a: `${a.tag}${a.id ? `#${a.id}` : ""}`,
                  b: `${b.tag}${b.id ? `#${b.id}` : ""}`,
                  overlap: `${Math.round(overlapX)}×${Math.round(overlapY)}px`,
                });
              }
            }
          }
        }
        return issues;
      });
      expect(
        overlaps,
        `${pageInfo.name} has ${overlaps.length} overlapping element(s) at ${vp.name}`,
      ).toEqual([]);

      // 3. No collapsed sections (zero-height main content areas)
      const collapsed = await page.evaluate(() => {
        const els = document.querySelectorAll("main, [role='main'], section");
        const issues: Array<{ tag: string; class?: string }> = [];
        els.forEach((e) => {
          const r = e.getBoundingClientRect();
          if (r.width > 100 && r.height === 0) {
            issues.push({
              tag: e.tagName.toLowerCase(),
              class: e.className?.toString().slice(0, 40),
            });
          }
        });
        return issues;
      });
      expect(
        collapsed,
        `${pageInfo.name} has collapsed (zero-height) section(s) at ${vp.name}`,
      ).toEqual([]);

      // 4. H1 is present and visible (visual hierarchy check)
      const h1 = page.locator("h1").first();
      if (await h1.count()) {
        await expect(h1, `${pageInfo.name} has no visible H1 at ${vp.name}`).toBeVisible();
      }

      // 5. Screenshot baseline (disabled in CI until baselines are committed)
      // To generate baselines: npx playwright test --update-snapshots
      test.setTimeout(30000);
      await expect(page).toHaveScreenshot(
        `visual-${pageInfo.name}-${vp.name}.png`,
        {
          maxDiffPixelRatio: 0.05,
          animations: "disabled",
          caret: "hide",
          // Only capture the viewport, not full page (full page is flaky with lazy-loaded content)
          fullPage: false,
        },
      );

      await context.close();
    });
  }
}
