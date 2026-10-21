import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PHONE_SIZES, THEMES, expectNoHorizontalClip, gotoPhone, trackConsole } from "./_helpers";

// owner 2026-10-21: phone board = card list + sticky bar + filter sheet.
const BOARD = "/board/all";

test.describe("mobile board", () => {
  test("cards replace the table: one list, 44px rows, 8+ above the fold", async ({ page }) => {
    const errors = trackConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPhone(page, BOARD);
    const list = page.getByRole("list", { name: "Leaderboard" });
    await expect(list).toBeVisible();
    await expect(page.locator("table.board-t")).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(0);
    const cards = list.locator("li.bc");
    expect(await cards.count()).toBeGreaterThanOrEqual(8);
    const vh = page.viewportSize()!.height;
    const tabsTop = (await page.locator(".m-tabs").boundingBox())!.y;
    let above = 0;
    for (const c of await cards.all()) {
      const b = (await c.boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(44);
      if (b.y + b.height <= Math.min(vh, tabsTop) + 1) above++;
    }
    expect(above).toBeGreaterThanOrEqual(8);
    expect(errors.filter((e) => /hydrat/i.test(e) && !/aria-label="Theme/.test(e))).toEqual([]);
    await expectNoHorizontalClip(page);
  });

  test("tapping a card opens the profile; ⇄ opens compare", async ({ page }) => {
    await gotoPhone(page, BOARD);
    const first = page.locator("li.bc").first();
    const cmp = first.getByRole("link", { name: /^Compare / });
    expect(await cmp.getAttribute("href")).toMatch(/^\/compare\?a=/);
    const box = (await cmp.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    test.setTimeout(90_000); // a cold dev server compiles the profile route on first hit
    await first.locator("a.bc-main").click();
    await expect(page).toHaveURL(/\/user\/[^/?]+/, { timeout: 60_000 });
  });

  test("filter sheet drives the same filters as desktop", async ({ page }) => {
    await gotoPhone(page, BOARD);
    const before = await page.locator("li.bc").count();
    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await sheet.getByLabel("Filter table").fill("zzzz-no-such-operator");
    await sheet.getByRole("button", { name: /^Show 0/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator("li.bc")).toHaveCount(0);
    await expect(page.getByText("No rows match the current filter")).toBeVisible();
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("dialog", { name: "Filters" }).getByRole("button", { name: "Reset" }).click();
    await page.keyboard.press("Escape");
    await expect(page.locator("li.bc")).toHaveCount(before);
  });

  test("workflow toggle switches the view and Load more adds rows", async ({ page }) => {
    await gotoPhone(page, BOARD);
    const hitl = page.getByRole("button", { name: "Human in the loop" });
    await hitl.click();
    await expect(hitl).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Hybrid, combined view" }).click();
    const more = page.getByRole("button", { name: "Load more" });
    if (await more.count()) {
      const n = await page.locator("li.bc").count();
      await more.click();
      await expect.poll(() => page.locator("li.bc").count()).toBeGreaterThan(n);
    }
  });

  test("menu drawer carries the left-sidebar modules", async ({ page }) => {
    await gotoPhone(page, BOARD);
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByText(/TOP MOVERS/).first()).toBeVisible();
    await expect(menu.getByRole("link", { name: "Hall" }).first()).toBeVisible();
  });

  for (const size of PHONE_SIZES) {
    test(`no clipped content at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await gotoPhone(page, BOARD);
      await expectNoHorizontalClip(page);
    });
  }

  for (const theme of THEMES) {
    test(`axe clean on the card list (${theme})`, async ({ page }) => {
      await gotoPhone(page, BOARD, theme);
      const res = await new AxeBuilder({ page }).include(".stagecol").analyze();
      const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + (n.any[0]?.message ?? "")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }
});
