import { test, expect } from "@playwright/test";

// /board/history reads only the frozen July 31 snapshot. The shell's own
// session calls are the only API traffic allowed.
const LIVE = [/\/api\/live-board/, /\/api\/v1\/leaderboard/, /\/api\/(field|hall|compare|movers|board)/, /supabase\.co/];
const ALLOWED = [/\/api\/auth\/session/, /\/api\/v1\/profile/];

test("historical board makes no live ranking requests", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto("/board/history");
  await expect(page.getByText("Historical Leaderboard").first()).toBeVisible();
  const rows = page.locator("tr[data-archived-rank]");
  await rows.first().click();
  await page.getByRole("button", { name: "Next →" }).click();
  await rows.nth(3).click();
  const addButtons = page.getByRole("button", { name: "Add to compare" });
  if (await addButtons.count()) await addButtons.first().click();
  await page.waitForLoadState("networkidle");
  const live = urls.filter((u) => LIVE.some((re) => re.test(u)) && !ALLOWED.some((re) => re.test(u)));
  expect(live).toEqual([]);
});
