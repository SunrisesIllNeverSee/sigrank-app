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

  test("rank 1–3 numbers stay readable on bone (≥4.5:1)", async ({ page }) => {
    await page.goto("/board/history?theme=bone");
    for (const rank of [1, 2, 3]) {
      const cell = page.locator(`tr[data-archived-rank="${rank}"] td`).first();
      const ratio = await cell.evaluate((td) => {
        const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = ([r, g, b]: number[]) => {
          const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        let el: Element | null = td;
        let bg = "rgba(0, 0, 0, 0)";
        while (el && /rgba\(.*, 0\)|transparent/.test(bg)) {
          bg = getComputedStyle(el).backgroundColor;
          el = el.parentElement;
        }
        const [a, b] = [lum(rgb(getComputedStyle(td).color)), lum(rgb(bg))].sort((x, y) => y - x);
        return (a + 0.05) / (b + 0.05);
      });
      expect(ratio, `rank ${rank}`).toBeGreaterThanOrEqual(4.5);
    }
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
    const sheet = page.getByRole("dialog", { name: "OPERATOR · COMPARE" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Snapshot from July 31, 2026. Not linked to a live profile.")).toBeVisible();
    await expect(sheet.getByText("Richard Fu")).toBeVisible();
    await sheet.getByRole("button", { name: "Close OPERATOR · COMPARE" }).tap();
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: /menu/i }).first().tap();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Close Menu" }).tap();
    await expect(menu).toBeHidden();
  });
});

for (const width of [820, 1024]) {
  test.describe(`tablet ${width}`, () => {
    test.use({ viewport: { width, height: 1000 } });

    test("a row tap shows the mini profile", async ({ page }) => {
      await page.goto("/board/history");
      await page.locator("tr[data-archived-rank]:visible, li[data-archived-rank]:visible").first().click();
      await expect(page.getByText("Snapshot from July 31, 2026. Not linked to a live profile.").first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Add to compare" }).first()).toBeVisible();
    });
  });
}

test.describe("non-US browser locale", () => {
  test.use({ viewport: { width: 1440, height: 900 }, locale: "de-DE" });

  test("no hydration mismatch, numbers read as on July 31", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" && /hydrat|did not match/i.test(m.text())) errors.push(m.text());
    });
    page.on("pageerror", (e) => {
      if (/hydrat|did not match|#418|#425/i.test(e.message)) errors.push(e.message);
    });
    await page.goto("/board/history");
    await expect(page.locator("tr[data-archived-rank]").first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    await expect(page.locator('tr[data-archived-rank="1"]')).toContainText(/\d,\d{3}\.\d{2}/);
  });
});
