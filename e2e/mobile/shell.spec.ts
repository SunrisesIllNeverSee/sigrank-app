import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PHONE_SIZES, THEMES, expectNoHorizontalClip, gotoPhone, trackConsole } from "./_helpers";

const PAGES = ["/wiki", "/hall", "/compare", "/user/signal-92b4f9f485"];

test.describe("mobile shell chrome", () => {
  for (const path of PAGES) {
    test(`top bar + tab bar on ${path}`, async ({ page }) => {
      const errors = trackConsole(page);
      await gotoPhone(page, path);
      await expect(page.locator(".m-top")).toBeVisible();
      await expect(page.locator(".m-top").getByRole("button", { name: "Menu" })).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Primary" });
      await expect(nav).toBeVisible();
      await expect(nav.locator(".m-tab")).toHaveCount(4);
      // desktop-only chrome is gone on phones
      await expect(page.locator(".srail")).toBeHidden();
      await expect(page.locator(".ftr")).toBeHidden();
      expect(await page.locator(".edge, .reopen-tab").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).length)).toBe(0);
      // tap targets
      for (const el of await nav.locator(".m-tab").all()) {
        const box = await el.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
    });
  }

  for (const size of PHONE_SIZES) {
    test(`no clipped content at ${size.width}px (wiki, hall, profile)`, async ({ page }) => {
      await page.setViewportSize(size);
      for (const path of ["/wiki", "/hall", "/user/signal-92b4f9f485"]) {
        await gotoPhone(page, path);
        await expectNoHorizontalClip(page);
      }
    });
  }

  test("tab bar marks the current page", async ({ page }) => {
    await gotoPhone(page, "/compare");
    await expect(page.locator('.m-tabs [aria-current="page"]')).toContainText("Compare");
  });

  test("menu drawer: opens, lists nav, traps focus, Esc closes", async ({ page, browserName }) => {
    await gotoPhone(page, "/hall");
    await page.locator(".m-top").getByRole("button", { name: "Menu" }).click();
    const dlg = page.getByRole("dialog", { name: "Menu" });
    await expect(dlg).toBeVisible();
    for (const name of ["Hall", "SigRank", "Field", "Articles", "Blog", "Wiki", "Methodology", "Settings"]) {
      await expect(dlg.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    // Safari does not focus a button on tap, so there is no opener to restore focus to there.
    if (browserName !== "webkit") await expect(page.locator(".m-top").getByRole("button", { name: "Menu" })).toBeFocused();
  });

  test("browser Back closes an open drawer without leaving the page", async ({ page }) => {
    await gotoPhone(page, "/hall");
    await page.locator(".m-top").getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    expect(new URL(page.url()).pathname).toBe("/hall");
  });

  test("menu link navigates and Back returns here", async ({ page }) => {
    await gotoPhone(page, "/hall");
    await page.locator(".m-top").getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Wiki", exact: true }).click();
    await expect(page).toHaveURL(/\/wiki$/, { timeout: 20000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/hall$/);
  });

  test("Search tab opens a full-screen overlay with a 16px input", async ({ page }) => {
    await gotoPhone(page, "/hall");
    await page.locator(".m-tabs").getByRole("button", { name: "Search" }).click();
    const input = page.getByRole("combobox", { name: /Search operators and pages/ });
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    await input.fill("wiki");
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("account sheet opens from the top bar", async ({ page }) => {
    await gotoPhone(page, "/hall");
    await page.locator(".m-top").getByRole("button", { name: "Account" }).click();
    const sheet = page.locator(".m-sheet");
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("theme button cycles the workspace theme", async ({ page }) => {
    await gotoPhone(page, "/hall", "green");
    await page.locator(".m-top").getByRole("button", { name: /Switch theme/ }).click();
    await expect(page.locator(".lbw-root")).not.toHaveAttribute("data-theme", "green");
  });

  for (const theme of THEMES) {
    test(`axe clean (${theme})`, async ({ page }) => {
      await gotoPhone(page, "/hall", theme);
      const res = await new AxeBuilder({ page })
        .include(".m-top")
        .include(".m-tabs")
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(res.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});

test.describe("tablet (768px)", () => {
  test.use({ viewport: { width: 768, height: 1024 }, isMobile: false, hasTouch: false });

  test("sidebars start collapsed, stage is full width, no pan", async ({ page }) => {
    await page.goto("/hall");
    await page.locator(".stagecol").waitFor();
    await expect(page.locator(".lside")).toHaveCount(0);
    await expect(page.locator(".railcol")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const mid = document.querySelector(".mid")!;
      const stage = document.querySelector(".stagecol")!.getBoundingClientRect();
      return { sw: mid.scrollWidth, cw: mid.clientWidth, w: Math.round(stage.width) };
    });
    expect(m.sw).toBeLessThanOrEqual(m.cw);
    expect(m.w).toBe(m.cw);
    await expect(page.locator(".m-top")).toBeHidden();
    await expect(page.locator(".m-tabs")).toBeHidden();
  });

  test("a collapsed panel opens as an overlay drawer and Esc closes it", async ({ page }) => {
    await page.goto("/wiki");
    await page.locator(".reopen-l").click();
    const side = page.locator(".lside");
    await expect(side).toBeVisible();
    expect(await side.evaluate((el) => getComputedStyle(el).position)).toBe("absolute");
    await page.keyboard.press("Escape");
    await expect(side).toHaveCount(0);
  });
});
