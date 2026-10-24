import { test, expect } from "@playwright/test";

// The July 31 table reads site tokens as rgb(var(--x)) triplets; the island
// maps them from each workspace theme (components/history/history-island.css).
const THEMES = {
  green: { surface: "14 20 12", text: "233 243 223" },
  gold: { surface: "20 16 10", text: "243 234 210" },
  bone: { surface: "250 247 238", text: "28 27 21" },
  purple: { surface: "20 13 30", text: "239 231 250" },
} as const;
const ORDER = ["green", "gold", "bone", "purple"] as const;

function luminance(triplet: string) {
  const [r, g, b] = triplet.split(/\s+/).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const tokens = (page: import("@playwright/test").Page) =>
  page.locator(".hist-island").evaluate((el) => {
    const cs = getComputedStyle(el);
    return { surface: cs.getPropertyValue("--bg-surface").trim(), text: cs.getPropertyValue("--text-primary").trim() };
  });

for (const theme of ORDER) {
  test(`legacy table follows the ${theme} theme`, async ({ page }) => {
    await page.goto(`/board/history?theme=${theme}`);
    await expect(page.locator(`.lbw-root[data-theme="${theme}"]`)).toBeVisible();
    const t = await tokens(page);
    expect(t).toEqual(THEMES[theme]);
    expect(contrast(t.surface, t.text)).toBeGreaterThanOrEqual(4.5);
  });
}

test("Shift+T switches the legacy table's colors with the shell", async ({ page }) => {
  await page.goto("/board/history?theme=green");
  await expect(page.locator('.lbw-root[data-theme="green"]')).toBeVisible();
  await page.locator(".hist-header").click();
  await page.keyboard.press("Shift+T");
  await expect(page.locator('.lbw-root[data-theme="gold"]')).toBeVisible();
  expect((await tokens(page)).surface).toBe(THEMES.gold.surface);
});
