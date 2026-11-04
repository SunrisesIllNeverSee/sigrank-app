import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PIXEL_RATIO = 2;

test("board screenshot download is a real PNG sized to the visible table", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/board/all", { waitUntil: "domcontentloaded" });
  const card = page.locator("section.tablecard");
  const rows = card.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  await expect(rows.first()).not.toHaveClass(/board-empty/);

  let settled = -1;
  await expect
    .poll(async () => {
      const n = await rows.count();
      const stable = n === settled;
      settled = n;
      return stable;
    }, { intervals: [1000], timeout: 30_000 })
    .toBe(true);

  const headers = (await card.locator("thead th").allInnerTexts()).map((h) => h.trim());
  expect(headers.length).toBeGreaterThan(5);
  const rowCount = await rows.count();
  expect(rowCount).toBeGreaterThan(0);
  const box = (await card.boundingBox())!;

  await page.locator(".board-share").getByRole("button", { name: /^SHARE/ }).click();
  const shot = page.getByRole("button", { name: /Screenshot PNG/ });
  await expect(shot).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), shot.click()]);
  expect(download.suggestedFilename()).toMatch(/^sigrank-board-.+-p\d+\.png$/);
  await expect(page.locator(".shoterr")).toHaveCount(0);

  const path = await download.path();
  const buf = await readFile(path);
  expect(buf.length).toBeGreaterThan(20_000);
  expect([...buf.subarray(0, 8)]).toEqual(PNG_MAGIC);
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);

  expect(Math.abs(width - box.width * PIXEL_RATIO)).toBeLessThanOrEqual(PIXEL_RATIO * 2);
  expect(height).toBeGreaterThan(box.height * PIXEL_RATIO);

  await expect(card.locator("thead th")).toHaveCount(headers.length);
  expect(await rows.count()).toBeGreaterThanOrEqual(rowCount);
});
