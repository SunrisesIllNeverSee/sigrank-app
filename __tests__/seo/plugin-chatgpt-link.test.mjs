/**
 * __tests__/seo/plugin-chatgpt-link.test.mjs
 *
 * The /plugin page links to the official ChatGPT directory listing, and the
 * click fires the chatgpt_listing_click PostHog event. The URL lives in one
 * exported constant (components/plugin/ChatGptListingLink.tsx); this test reads
 * it from there.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

async function listingUrl() {
  const src = await source("components/plugin/ChatGptListingLink.tsx");
  const m = src.match(/CHATGPT_LISTING_URL\s*=\s*\n?\s*"([^"]+)"/);
  assert.ok(m, "CHATGPT_LISTING_URL constant not found");
  return m[1];
}

test("listing constant points at chatgpt.com plugins", async () => {
  assert.match(await listingUrl(), /^https:\/\/chatgpt\.com\/plugins\/plugin_/);
});

test("plugin page renders the link component and has no second hardcoded URL", async () => {
  const page = await source("app/plugin/page.tsx");
  assert.ok(page.includes("<ChatGptListingLink />"));
  assert.ok(!page.includes("chatgpt.com/plugins"));
});

test("link opens safely and tracks clicks", async () => {
  const src = await source("components/plugin/ChatGptListingLink.tsx");
  assert.ok(src.includes("href={CHATGPT_LISTING_URL}"));
  assert.match(src, /rel="noopener noreferrer"/);
  assert.ok(src.includes("track.chatgptListingClicked"));
});

test("event helper emits chatgpt_listing_click", async () => {
  assert.ok((await source("lib/infra/posthog/events.ts")).includes('"chatgpt_listing_click"'));
});

test("README links the same listing", async () => {
  assert.ok((await source("README.md")).includes(await listingUrl()));
});
