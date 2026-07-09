import { test, expect } from "@playwright/test";

test("theme cycles via Shift+T + persists", async ({ page }) => {
  await page.goto("/");
  // Default theme is terminal
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "terminal");

  // Shift+T cycles to next theme
  await page.keyboard.press("Shift+t");
  const theme1 = await html.getAttribute("data-theme");
  expect(theme1).not.toBe("terminal");

  // Cycle through all 4 themes back to terminal
  await page.keyboard.press("Shift+t");
  await page.keyboard.press("Shift+t");
  await page.keyboard.press("Shift+t");
  await expect(html).toHaveAttribute("data-theme", "terminal");

  // localStorage persists
  const stored = await page.evaluate(() =>
    localStorage.getItem("sigrank-theme"),
  );
  expect(stored).toBe("terminal");
});
