/**
 * e2e/mobile/profile.spec.ts — phone profile (T2, owner 2026-10-21).
 * Run: E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/mobile/profile.spec.ts --project=mobile-chromium
 */
import { test, expect } from "@playwright/test";
import { PHONE_SIZES, gotoPhone, expectNoHorizontalClip, trackConsole } from "./_helpers";

const CODENAME = "furic";
const TABS = ["overview", "stats", "analysis", "submissions", "social", "badges"] as const;

for (const size of PHONE_SIZES) {
  test.describe(`profile @ ${size.width}`, () => {
    test.use({ viewport: size });

    for (const tab of TABS) {
      test(`${tab}: no horizontal clip`, async ({ page }) => {
        const logs = trackConsole(page);
        await gotoPhone(page, `/user/${CODENAME}?tab=${tab}`);
        await expectNoHorizontalClip(page);
        expect(logs.filter((l) => /hydrat/i.test(l))).toEqual([]);
      });
    }

    test("holocard and flap board fully visible", async ({ page }) => {
      await gotoPhone(page, `/user/${CODENAME}`);
      // The shell floats (animation), so measure its stable scaled wrapper.
      const card = page.locator(".pv2-pcard-fit").first();
      await card.evaluate((e) => e.scrollIntoView());
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
      const flap = await page.locator(".pv2-flapboard").boundingBox();
      expect(flap!.x + flap!.width).toBeLessThanOrEqual(size.width + 1);
    });

    test("tab strip is a keyboard-operable tablist with 44px targets", async ({ page }) => {
      await gotoPhone(page, `/user/${CODENAME}`);
      const tabs = page.locator('[role="tablist"][aria-label="Profile sections"] [role="tab"]:not([disabled])');
      for (const h of await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(43.5);
      }
      await tabs.first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/stats/i);
    });

    test("header buttons present", async ({ page }) => {
      await gotoPhone(page, `/user/${CODENAME}`);
      const head = page.locator(".ws-pm-head");
      await expect(head.getByRole("button", { name: "Share" })).toBeVisible();
      await expect(head.getByRole("link", { name: "Compare" })).toHaveAttribute("href", new RegExp(`/compare\\?a=${CODENAME}`));
    });
  });
}

test.describe("profile sheets", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("rail dialog opens as a bottom sheet", async ({ page }) => {
    await gotoPhone(page, `/user/${CODENAME}`);
    await page.getByRole("button", { name: /operator panel/i }).tap();
    await page.locator(".prl-open").first().tap();
    const dlg = page.locator("dialog.prl-dialog[open]");
    await expect(dlg).toBeVisible();
    const b = await dlg.boundingBox();
    expect(b!.width).toBeGreaterThanOrEqual(389);
    expect(Math.round(b!.y + b!.height)).toBeGreaterThanOrEqual(843);
  });

  test("badge detail is a bottom sheet", async ({ page }) => {
    await gotoPhone(page, `/user/${CODENAME}?tab=badges`);
    await page.locator(".badge-tile").first().tap();
    const d = page.locator(".badge-detail");
    await expect(d).toBeVisible();
    const b = await d.boundingBox();
    expect(b!.x).toBe(0);
    expect(Math.round(b!.y + b!.height)).toBeGreaterThanOrEqual(843);
  });
});
