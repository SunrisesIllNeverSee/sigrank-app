#!/usr/bin/env node
// verify-board-selection.mjs — diff the legacy board selection against the
// database-side selection (migration 0059) on a REAL database.
//
//   BOARD_VERIFY_URL=https://<ref>.supabase.co \
//   BOARD_VERIFY_KEY=<anon or service key> \
//   node scripts/verify-board-selection.mjs
//
// Run it only AFTER migration 0059 is applied to the database under test
// (a Supabase branch or a restored copy first is ideal). It is read-only:
// SELECTs plus the read-only board_* functions. The comparison itself lives in
// __tests__/board/board-selection-live.test.ts; this wrapper checks the inputs
// and runs it. Exit code 0 = identical for every param combination.
//
// NOT run by CI and NOT run against production by the author of this change.

import { spawnSync } from "node:child_process";

const { BOARD_VERIFY_URL, BOARD_VERIFY_KEY } = process.env;
if (!BOARD_VERIFY_URL || !BOARD_VERIFY_KEY) {
  console.error("Set BOARD_VERIFY_URL and BOARD_VERIFY_KEY (see the header of this script).");
  process.exit(2);
}

const r = spawnSync(
  "npx",
  ["vitest", "run", "__tests__/board/board-selection-live.test.ts", "--reporter=verbose"],
  { stdio: "inherit", env: process.env },
);
process.exit(r.status ?? 1);
