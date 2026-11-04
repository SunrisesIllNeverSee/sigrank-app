import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PIXEL_RATIO = 2;

test("board screenshot download is a real PNG with every table row drawn", async ({ page }) => {
  test.setTimeout(90_000);
  const summary = page
    .waitForResponse((r) => r.url().includes("/api/v1/board/signup-summary"), { timeout: 30_000 })
    .catch(() => null);
  await page.goto("/board/all", { waitUntil: "domcontentloaded" });
  const card = page.locator("section.tablecard");
  const rows = card.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  await expect(rows.first()).not.toHaveClass(/board-empty/);
  await summary;

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
  const { bands, fullHeight } = await card.evaluate((el) => {
    const top = el.getBoundingClientRect().top - el.scrollTop;
    const cs = getComputedStyle(el);
    return {
      fullHeight: el.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth),
      bands: [...el.querySelectorAll("tbody tr")].map((r) => {
        const b = r.getBoundingClientRect();
        return { top: b.top - top, height: b.height };
      }),
    };
  });
  expect(bands.length).toBe(rowCount);

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

  const overlay = height / PIXEL_RATIO - fullHeight;
  expect(overlay).toBeGreaterThan(20);
  expect(overlay).toBeLessThan(120);
  const viewer = await page.context().newPage();
  const ink = await viewer.evaluate(
    async ({ src, bands, overlay, ratio }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return bands.map(({ top, height }) => {
        const y = Math.round((overlay + top) * ratio) + 2;
        const h = Math.round(height * ratio) - 4;
        if (h <= 0 || y + h > canvas.height) return -1;
        const d = ctx.getImageData(0, y, canvas.width, h).data;
        const counts = new Map<number, number>();
        for (let i = 0; i < d.length; i += 4) {
          const k = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
        const bg = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const br = ((bg >> 8) & 15) * 16 + 8;
        const bgG = ((bg >> 4) & 15) * 16 + 8;
        const bb = (bg & 15) * 16 + 8;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (Math.abs(d[i] - br) + Math.abs(d[i + 1] - bgG) + Math.abs(d[i + 2] - bb) > 120) n++;
        }
        return n / (d.length / 4);
      });
    },
    { src: `data:image/png;base64,${buf.toString("base64")}`, bands, overlay, ratio: PIXEL_RATIO },
  );
  await viewer.close();
  ink.forEach((v, i) => expect(v, `row ${i + 1} of ${ink.length} has no visible text in the PNG`).toBeGreaterThan(0.01));

  await expect(card.locator("thead th")).toHaveCount(headers.length);
  expect(await rows.count()).toBeGreaterThanOrEqual(rowCount);
});
