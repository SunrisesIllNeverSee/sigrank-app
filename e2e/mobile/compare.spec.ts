import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  PHONE_SIZES,
  THEMES,
  expectNoHorizontalClip,
  gotoPhone,
} from "./_helpers";

// owner 2026-10-21: /compare on phones is one column, vertical scroll only.
test.describe("mobile compare", () => {
  for (const size of PHONE_SIZES) {
    test(`stacked order, no clip, 11px radar labels at ${size.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await gotoPhone(page, "/compare");
      await expectNoHorizontalClip(page);

      // order: score card, A composite, B composite, head-to-head, ledger, history
      const tops = await page.evaluate(() => {
        const y = (sel: string, i = 0) => {
          const el = [...document.querySelectorAll(sel)].filter(
            (e) => (e as HTMLElement).offsetParent !== null,
          )[i];
          return el ? el.getBoundingClientRect().top + window.scrollY : NaN;
        };
        return [
          y(".cmp-m-score"),
          y(".cmp-matchup-panel", 0),
          y(".cmp-matchup-panel", 1),
          y(".cmp-h2h"),
          y(".cmp-ledger-workspace"),
          y(".cmp-hist-phone"),
        ];
      });
      const sorted = [...tops].sort((a, b) => a - b);
      expect(tops.every((t) => Number.isFinite(t))).toBe(true);
      expect(tops).toEqual(sorted);

      // every radar rendered text is 11px or more, and every radar has a name
      const small = await page.evaluate(() => {
        const out: string[] = [];
        for (const svg of document.querySelectorAll<SVGSVGElement>(
          ".cmp-rd-svg",
        )) {
          if (!(svg as unknown as HTMLElement).offsetParent) continue;
          const vb = svg.viewBox.baseVal;
          const scale = svg.getBoundingClientRect().width / vb.width;
          for (const t of svg.querySelectorAll("text")) {
            const px = parseFloat(getComputedStyle(t).fontSize) * scale;
            if (px < 10.9) out.push(`${t.textContent}:${px.toFixed(1)}`);
          }
          expect(svg.getAttribute("aria-label")).toBeTruthy();
        }
        return out;
      });
      expect(small).toEqual([]);
    });
  }

  test("selectors stack with a 44px swap button that swaps A and B", async ({
    page,
  }) => {
    await gotoPhone(page, "/compare?a=signal-92b4f9f485&b=signal-d4e0290661");
    const swap = page.getByRole("button", { name: "Swap operators A and B" });
    await expect(swap).toBeVisible();
    const box = (await swap.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    await swap.click();
    await expect(page).toHaveURL(/a=signal-d4e0290661&b=signal-92b4f9f485/);
  });

  test("share falls back to copy-link when navigator.share is missing", async ({
    page,
    context,
  }) => {
    await context
      .grantPermissions(["clipboard-read", "clipboard-write"])
      .catch(() => {});
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async () => {} },
        configurable: true,
      });
    });
    await gotoPhone(page, "/compare");
    await page.getByRole("button", { name: /^Share/ }).click();
    await expect(page.locator(".cmp-m-note")).toHaveText("Link copied");
  });

  test.describe("tablet", () => {
    test.use({
      isMobile: false,
      hasTouch: false,
      viewport: { width: 768, height: 1024 },
    });
    test("768 does not pan", async ({ page }) => {
      await page.goto("/compare");
      await page.locator(".ws-cmp").waitFor();
      const m = await page.evaluate(() => {
        // the stage is what used to pan (min 600px grid track); it must fit its column
        const stage = document.querySelector(".stage") as HTMLElement;
        return {
          sw: stage.scrollWidth,
          cw: stage.clientWidth,
          doc: document.documentElement.scrollWidth,
        };
      });
      expect(m.sw).toBeLessThanOrEqual(m.cw);
      expect(m.doc).toBeLessThanOrEqual(768);
    });
  });

  for (const theme of THEMES) {
    test(`axe clean on /compare (${theme})`, async ({ page }) => {
      await gotoPhone(page, "/compare", theme);
      const res = await new AxeBuilder({ page })
        .include(".ws-cmp")
        .exclude("figcaption")
        .analyze();
      expect(
        res.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        ),
      ).toEqual([]);
    });
  }
});
