import { test, expect } from "@playwright/test";

// "Real data, not sample data" (owner-approved E2E warning job, 2026-11-04).
//
// The app never fails loudly when Supabase is missing or erroring: it falls
// back to (a) the build-time cold-store snapshot (lib/board/snapshot.json, a
// frozen copy of an older live board) or (b) hand-authored mock seeds
// (lib/board/mock.ts). Pages "render" either way, so structure-only specs can
// pass on a broken site. This spec keys on signals the fallbacks cannot fake:
//
//   1. Mock fixture codenames (lib/board/mock.ts SEED_CORPUS) never appear.
//   2. /api/live-board is fresh: its newest `lastIso` is recent. The cold
//      store is frozen, so it ages out of the window and trips this check.
//   3. A profile page for a live-feed operator renders that operator's name
//      and the feed's Υ value, so profile and board agree.
//
// The mock path emits no explicit marker (no data-source attribute), so
// check 1 is by fixture name and check 2 is by freshness.

const MOCK_FIXTURE_NAMES = [
  "OrcaVanguard",
  "IronLattice",
  "PrismCartographer",
  "MeridianScribe",
  "VectorHerald",
  "EmberCoil",
  "DriftPilgrim",
  "SignalFledgling",
  "QuietHollow",
  "AshIgnition",
  "TransVaultOrigin",
  "static seed",
  "app seed",
];

// Cold-store snapshot newest row is 2026-09-27; live ingestion is far fresher.
const MAX_AGE_DAYS = Number(process.env.E2E_MAX_DATA_AGE_DAYS ?? 30);

type LiveOperator = {
  codename: string;
  name: string | null;
  yield: string;
  lastIso: string | null;
};
type LiveBoard = {
  generated_at: string;
  total_operators: number;
  operators: LiveOperator[];
};

async function liveBoard(
  request: import("@playwright/test").APIRequestContext,
): Promise<LiveBoard> {
  const res = await request.get("/api/live-board?window=all");
  expect(res.status(), "/api/live-board must answer 200").toBe(200);
  return (await res.json()) as LiveBoard;
}

test("live feed is real and fresh, not mock or cold-store", async ({ request }) => {
  const board = await liveBoard(request);
  expect(board.operators.length).toBeGreaterThan(0);
  expect(board.total_operators).toBeGreaterThan(0);

  const names = board.operators.flatMap((o) => [o.codename, o.name ?? ""]);
  for (const fixture of MOCK_FIXTURE_NAMES) {
    expect(
      names.filter((n) => n.includes(fixture)),
      `mock fixture "${fixture}" in live feed`,
    ).toEqual([]);
  }

  const newest = board.operators
    .map((o) => o.lastIso)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
  expect(newest, "no operator has a last-seen date").toBeTruthy();
  const ageDays = (Date.now() - Date.parse(newest as string)) / 86_400_000;
  expect(
    ageDays,
    `newest operator data is ${ageDays.toFixed(1)} days old (newest ${newest}); the site may be serving the frozen cold-store snapshot`,
  ).toBeLessThanOrEqual(MAX_AGE_DAYS);
});

test("board page shows no sample data", async ({ page }) => {
  await page.goto("/board/all", { waitUntil: "domcontentloaded" });
  await expect(page.locator("table tbody tr").first()).toBeVisible({
    timeout: 30_000,
  });
  const text = await page.locator("body").innerText();
  for (const fixture of MOCK_FIXTURE_NAMES) {
    expect(text, `mock fixture "${fixture}" on /board/all`).not.toContain(fixture);
  }
});

test("profile of a live-feed operator matches the feed", async ({
  page,
  request,
}) => {
  const board = await liveBoard(request);
  const op = board.operators.find((o) => o.name && o.yield);
  expect(op, "live feed has no operator with a name and yield").toBeTruthy();
  const { codename, name, yield: yieldText } = op as LiveOperator;

  const res = await page.goto(`/user/${encodeURIComponent(codename)}`, {
    waitUntil: "domcontentloaded",
  });
  expect(res?.status()).toBe(200);
  // <title> is "<Name> · Υ <yield> · SigRank SignalAF" and is server-rendered
  // from the same data as the board.
  await expect(page).toHaveTitle(new RegExp(escapeRe(name as string)));
  await expect(page).toHaveTitle(new RegExp(escapeRe(yieldText)));
  const text = await page.locator("body").innerText();
  for (const fixture of MOCK_FIXTURE_NAMES) {
    expect(text, `mock fixture "${fixture}" on profile`).not.toContain(fixture);
  }
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
