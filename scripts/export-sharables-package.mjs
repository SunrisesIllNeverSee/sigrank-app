#!/usr/bin/env node
/*
  Exports one white-holographic PNG and four animated color GIFs.
  Files are local/CI artifacts, NEVER published to the website.
  Usage: node scripts/export-sharables-package.mjs --codename signal-17cd049318
*/
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const palettes = ["aqua", "coral", "gold", "violet"];
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const codename = arg("--codename");
const sourceBase = process.env.SHARABLES_SOURCE_URL || "https://signalaf.com";
if (!codename || !/^[A-Za-z0-9][A-Za-z0-9_.-]{1,75}$/.test(codename)) {
  console.error("Usage: --codename <existing public operator codename>");
  process.exit(2);
}
const origin = new URL(sourceBase);
if (origin.protocol !== "https:" && !(origin.hostname === "localhost" && origin.protocol === "http:")) {
  throw new Error("The source URL must be HTTPS or localhost.");
}
const output = path.resolve(arg("--out") || path.join("release-staging", "sharables-package", codename));
await mkdir(output, { recursive: true });
const manifest = {
  type: "signalaf-sharables-offline-package",
  sitePublication: false,
  operator: codename,
  source: new URL("/s/" + encodeURIComponent(codename), origin).href,
  createdAt: new Date().toISOString(),
  contents: [],
};
const browser = await chromium.launch({ headless: true });
async function verifyAndRecord(file, format, palette) {
  const bytes = await readFile(file);
  const valid = format === "png"
    ? bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    : bytes.subarray(0, 6).toString("ascii") === "GIF89a";
  if (!valid || bytes.length < 1000) throw new Error("Invalid " + format + " export: " + file);
  manifest.contents.push({
    file: path.basename(file),
    format: format.toUpperCase(),
    palette,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  console.log(format.toUpperCase() + " " + palette + ": " + file + " (" + bytes.length + " bytes)");
}
async function saveDownload(page, button, filename, format, palette) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 180000 }),
    button.click({ timeout: 45000 }),
  ]);
  const target = path.join(output, filename);
  await download.saveAs(target);
  await verifyAndRecord(target, format, palette);
}
try {
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1600, height: 1050 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const response = await page.goto(manifest.source, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!response?.ok()) throw new Error("Share page HTTP " + (response?.status() || "no response"));
  const studio = page.locator("section#share-bone-holocard");
  await studio.waitFor({ state: "visible", timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await studio.locator(".bone-holo-card").waitFor();
  await studio.getByLabel("Brand mark").selectOption("af-stack");
  await studio.getByLabel("Hologram color").selectOption("aqua");
  await saveDownload(
    page, studio.getByRole("button", { name: "Download PNG" }),
    "signalaf-" + codename + "-white-holo.png", "png", "aqua",
  );
  for (const palette of palettes) {
    await studio.getByLabel("Hologram color").selectOption(palette);
    await saveDownload(
      page, studio.getByRole("button", { name: "Download GIF" }),
      "signalaf-" + codename + "-holo-" + palette + ".gif", "gif", palette,
    );
  }
  await writeFile(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(output, "README.txt"),
    "SIGNALAF SHARABLES PACKAGE\nOperator: " + codename +
    "\n\nOne white-holo PNG plus four animated holographic GIFs. Not deployed to the website.\n");
  console.log("COMPLETE: " + manifest.contents.length + " assets in " + output);
} finally {
  await browser.close();
}
