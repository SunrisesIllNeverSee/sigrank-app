#!/usr/bin/env node
// check-migration-parity.mjs
// Guardrail: verifies Supabase migration ledger parity before allowing db push.
//
// Usage:
//   node scripts/check-migration-parity.mjs              # interactive (prompts on pending)
//   node scripts/check-migration-parity.mjs --ci         # CI mode (hard-fails on any non-clean state)
//   node scripts/check-migration-parity.mjs --allow-pending  # allows pending migrations (for intentional pushes)
//
// Exit codes:
//   0 — parity confirmed (up to date, or pending migrations explicitly allowed)
//   1 — drift detected (remote-only entries = ledger has versions with no local file)
//   2 — pending migrations and NOT --allow-pending (or --ci mode)
//   3 — supabase CLI not available or not linked
//
// This script NEVER runs `supabase db push` — it only runs `--dry-run` (read-only).

import { execFileSync } from "node:child_process";
import { exit } from "node:process";

const args = new Set(process.argv.slice(2));
const CI_MODE = args.has("--ci");
const ALLOW_PENDING = args.has("--allow-pending");

function runSupabase(command, ...passArgs) {
  try {
    const output = execFileSync("supabase", [command, ...passArgs], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });
    return { ok: true, output };
  } catch (err) {
    return { ok: false, output: err.stdout || err.stderr || err.message };
  }
}

function main() {
  // 1. Verify supabase CLI is available and project is linked
  const listResult = runSupabase("migration", "list", "--linked", "-o", "json");
  if (!listResult.ok) {
    console.error("✗ supabase CLI not available or project not linked.");
    console.error("  Error:", listResult.output.split("\n").slice(0, 5).join("\n"));
    exit(3);
  }

  // 2. Run db push --dry-run (read-only — never pushes)
  const dryRunResult = runSupabase("db", "push", "--dry-run", "--linked");
  if (!dryRunResult.ok) {
    console.error("✗ supabase db push --dry-run failed.");
    console.error("  Output:", dryRunResult.output.split("\n").slice(0, 10).join("\n"));
    exit(1);
  }

  const output = dryRunResult.output;

  // 3. Parse the dry-run output
  // "Remote database is up to date." → parity confirmed, nothing to push
  // "DRY RUN: migrations will *not* be pushed..." + list of pending → pending migrations
  // "Remote migration versions not found in local migrations directory" → drift (remote-only)

  const isUpToDate = /Remote database is up to date/i.test(output);
  const hasRemoteOnly = /not found in local migrations directory/i.test(output) ||
                        /migration repair --status reverted/i.test(output);
  const hasPending = /DRY RUN/i.test(output) && !isUpToDate && !hasRemoteOnly;

  // Also check for "Skipping migration" warnings (seed files with wrong names)
  const skippingMatches = output.match(/Skipping migration (\S+)/g) || [];

  if (hasRemoteOnly) {
    console.error("✗ DRIFT DETECTED: remote ledger has entries with no local file.");
    console.error("  This means the ledger and local migrations/ are out of sync.");
    console.error("  Run `supabase migration list --linked` to see the gap, then either:");
    console.error("    - `supabase migration repair --status reverted <version>` to remove stale ledger entries");
    console.error("    - `supabase db pull` to regenerate local files from the remote schema");
    console.error("");
    console.error("  Raw dry-run output:");
    console.error(output.split("\n").map(l => "    " + l).join("\n"));
    exit(1);
  }

  if (hasPending) {
    // Extract pending migration names
    const pendingLines = output
      .split("\n")
      .filter(l => l.trim() && !l.startsWith("DRY RUN") && !l.startsWith("Connecting") &&
                   !l.startsWith("Initialising") && !l.includes("Skipping migration") &&
                   !l.includes("A new version") && !l.includes("We recommend"));

    if (ALLOW_PENDING && !CI_MODE) {
      console.warn("⚠ PENDING MIGRATIONS (allowed via --allow-pending):");
      pendingLines.forEach(l => console.warn("    " + l.trim()));
      console.warn("  These will be pushed when you run `supabase db push --linked`.");
      exit(0);
    } else {
      console.error("✗ PENDING MIGRATIONS detected (not allowed in this mode):");
      pendingLines.forEach(l => console.error("    " + l.trim()));
      console.error("");
      console.error("  To push these intentionally, re-run with --allow-pending:");
      console.error("    node scripts/check-migration-parity.mjs --allow-pending");
      console.error("  Then run: supabase db push --linked");
      exit(2);
    }
  }

  if (isUpToDate) {
    console.log("✓ Migration parity confirmed: remote database is up to date.");
    if (skippingMatches.length > 0) {
      console.warn("  ⚠ Skipped files (wrong filename pattern, not migrations):");
      skippingMatches.forEach(s => console.warn("    " + s));
      console.warn("  These should be in supabase/seeds/ not supabase/migrations/.");
    }
    exit(0);
  }

  // Unknown state — fail safe
  console.error("✓ Could not determine parity state from dry-run output.");
  console.error("  Raw output:");
  console.error(output.split("\n").map(l => "    " + l).join("\n"));
  exit(1);
}

main();
