import { test } from "@playwright/test";

// Before/after screenshots for the /board/history PR (local only, never CI).
// SHOTS_LABEL=before|after; output in _shots/<label>/ (git-ignored).
const LABEL = process.env.SHOTS_LABEL ?? "";
const THEMES = ["green", "gold", "bone", "purple"] as const;
const SIZES = [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
] as const;
const PATHS = ["/", "/board/all", "/compare", "/hall", "/user/furic", ...(LABEL === "after" ? ["/board/history"] : [])];

test.skip(!!process.env.CI || !LABEL, "local screenshot capture only; set SHOTS_LABEL");

for (const path of PATHS) {
  for (const { w, h } of SIZES) {
    test(`capture ${path} @${w}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: w, height: h });
      const slug = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
      for (const theme of THEMES) {
        await page.goto(`${path}?theme=${theme}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        await page.screenshot({ path: `_shots/${LABEL}/${slug}-${theme}-${w}.png` });
      }
    });
  }
}
