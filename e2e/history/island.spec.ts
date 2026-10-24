import { test, expect } from "@playwright/test";

const THEMES = ["green", "gold", "bone", "purple"] as const;

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("header, last row, mini profile and compare", async ({ page }) => {
    await page.goto("/board/history");
    await expect(page.getByRole("heading", { name: "Historical Leaderboard" })).toBeVisible();
    await expect(page.getByText("1,642 operators").first()).toBeVisible();
    await expect(page.getByText("ARCHIVE · FROZEN").first()).toBeVisible();

    const rows = page.locator("tr[data-archived-rank]");
    await rows.first().click();
    const left = page.locator("#lbw-left-panel");
    await expect(left.getByText("Richard Fu")).toBeVisible();
    await left.getByRole("button", { name: "Add to compare" }).click();
    await rows.nth(2).click();
    await left.getByRole("button", { name: "Add to compare" }).click();
    const right = page.locator("#lbw-right-panel");
    await expect(right.getByTestId("hist-cmp-rank-0")).toHaveText("#1");
    await expect(right.getByTestId("hist-cmp-rank-1")).toHaveText("#3");

    // Last page reaches archived rank 1642 (original table paginates 25/row-page).
    await page.getByPlaceholder("name or @handle…").first().fill("");
    const lastPage = page.locator("button", { hasText: /^66$/ });
    if (await lastPage.count()) await lastPage.first().click();
    else for (let i = 0; i < 65; i++) await page.getByRole("button", { name: "Next →" }).click();
    await expect(page.locator('tr[data-archived-rank="1642"]')).toBeVisible();
  });

  for (const theme of THEMES) {
    test(`renders in ${theme}`, async ({ page }) => {
      await page.goto(`/board/history?theme=${theme}`);
      await expect(page.locator(`.lbw-root[data-theme="${theme}"]`)).toBeVisible();
      await expect(page.locator("tr[data-archived-rank]").first()).toBeVisible();
    });
  }
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("cards scroll, a tap opens the mini profile sheet, menu opens and closes", async ({ page }) => {
    await page.goto("/board/history");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const cards = page.locator("li[data-archived-rank]:visible");
    await expect(cards).toHaveCount(25);
    await cards.nth(10).scrollIntoViewIfNeeded();
    await cards.first().tap();
    const sheet = page.getByRole("dialog", { name: "COMPARE" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Snapshot from July 31, 2026. Not linked to a live profile.")).toBeVisible();
    await expect(sheet.getByText("Richard Fu")).toBeVisible();
    await sheet.getByRole("button", { name: "Close COMPARE" }).tap();
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: /menu/i }).first().tap();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Close Menu" }).tap();
    await expect(menu).toBeHidden();
  });
});
