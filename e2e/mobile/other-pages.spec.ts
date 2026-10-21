/**
 * e2e/mobile/other-pages.spec.ts (T3, owner 2026-10-21): the editorial pages
 * (hall, wiki, blog, field, fieldhub, sigrank) must be readable on phones:
 * nothing past the viewport edge, no pinned masthead eating the screen, 44px
 * hall taps, and the landing pause button clear of the tab bar.
 */
import { test, expect, type Page } from "@playwright/test";
import { PHONE_SIZES, THEMES, gotoPhone } from "./_helpers";

const PAGES = ["/hall", "/wiki", "/wiki/metrics/yield", "/wiki/four-degrees", "/blog", "/blog/a-tour-of-the-new-signalaf", "/field", "/fieldhub", "/sigrank"];

/** Visible elements whose right/left edge leaves the viewport, ignoring anything inside a horizontal scroller. */
async function offscreen(page: Page) {
  return page.evaluate(() => {
    const iw = window.innerWidth;
    const bad: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (r.right <= iw + 1 && r.left >= -1)) continue;
      let a = el.parentElement;
      let scroller = false;
      while (a && a !== document.body) {
        if (/(auto|scroll)/.test(getComputedStyle(a).overflowX)) { scroller = true; break; }
        a = a.parentElement;
      }
      if (!scroller) bad.push(`${el.tagName}.${String((el as HTMLElement).className).slice(0, 40)} L${Math.round(r.left)} R${Math.round(r.right)}`);
    }
    return bad;
  });
}

test.describe("other pages readable on phones", () => {
  for (const size of PHONE_SIZES.slice(0, 2)) {
    for (const path of PAGES) {
      test(`no element past the viewport edge: ${path} @${size.width}`, async ({ page }) => {
        await page.setViewportSize(size);
        await gotoPhone(page, path);
        await page.waitForTimeout(500);
        expect(await offscreen(page)).toEqual([]);
      });
    }
  }

  for (const theme of THEMES) {
    test(`/wiki and /hall render in the ${theme} theme`, async ({ page }) => {
      for (const path of ["/wiki", "/hall"]) {
        await gotoPhone(page, path, theme);
        await expect(page.locator(".stagecol")).toBeVisible();
        expect(await offscreen(page)).toEqual([]);
      }
    });
  }

  test("masthead is not pinned on phones (reading room)", async ({ page }) => {
    await gotoPhone(page, "/wiki");
    const pos = await page.evaluate(() => {
      const h = document.querySelector(".ws-editorial-stage .ws-hero, .ws-editorial-stage header.wave-hero");
      return h ? getComputedStyle(h).position : "none";
    });
    expect(pos).not.toBe("sticky");
  });

  test("hall name links and share buttons are 44px tall", async ({ page }) => {
    await gotoPhone(page, "/hall");
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll(".hall-record-row .truncate a, .hall-record-row button")) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height < 43) out.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return out;
    });
    expect(small).toEqual([]);
  });

  test("/sigrank pause button sits above the tab bar, not on it", async ({ page }) => {
    await gotoPhone(page, "/sigrank");
    const btn = page.getByRole("button", { name: /landing motion/i });
    await expect(btn).toBeVisible();
    const b = (await btn.boundingBox())!;
    const t = (await page.locator(".m-tabs").boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(t.y);
    expect(b.x).toBeGreaterThan(200); // right side, off the Board tab
  });
});
