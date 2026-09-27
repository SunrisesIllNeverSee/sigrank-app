#!/usr/bin/env node
/**
 * scripts/check-repo-hygiene.mjs — repo hygiene checks (REPO_CLEANUP_PLAN §16).
 *
 * Check 1 — Broken tracked symlinks (§16.1):
 *   Fails if any tracked symlink points at a missing target. Added after the
 *   tiun-sdk uninstall left 52 broken alias symlinks tracked at repo root.
 *
 * Check 2 — Tracked-but-ignored files (§16.2):
 *   Fails if a file is BOTH tracked in the index AND matched by ignore rules —
 *   the class of bug that nearly committed supabase/.temp/cli-latest (explicitly
 *   "never commit" per supabase/.gitignore). Files in KNOWN_TRACKED_IGNORED are
 *   pre-existing violations with their own cleanup PRs; remove entries as they
 *   are untracked rather than letting the list grow.
 *
 * Usage: node scripts/check-repo-hygiene.mjs
 * Wire into CI or `npm run verify` when the CI decision (Phase 3) lands.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/** Known tracked+ignored files — PR-2 scope (.swc binary untrack). Do NOT add
 *  new entries; a new violation should fail the check and be fixed instead. */
const KNOWN_TRACKED_IGNORED = new Set([
  ".swc/.gitignore",
  ".swc/plugins/macos_aarch64_22.0.1/6ea9d3dec20e87696401db15d4c456817f842cb74b13af645633912dceb61bd5.wasmer-v7",
]);

let failed = false;

// ── Check 1: broken tracked symlinks ─────────────────────────────────────
const lsOut = execFileSync("git", ["ls-files", "-s"], { encoding: "utf8" });
const symlinks = lsOut
  .split("\n")
  .filter((l) => l.startsWith("120000 "))
  .map((l) => l.split("\t")[1]);

const broken = symlinks.filter((p) => !existsSync(p));
if (broken.length) {
  failed = true;
  console.error(`✗ ${broken.length} broken tracked symlink(s):`);
  for (const p of broken) {
    let target = "";
    try {
      target = execFileSync("readlink", [p], { encoding: "utf8" }).trim();
    } catch {}
    console.error(`  ${p} -> ${target || "(unreadable)"}`);
  }
} else {
  console.log(`✓ ${symlinks.length} tracked symlinks, all resolve`);
}

// ── Check 2: tracked-but-ignored files ───────────────────────────────────
const ignoredTracked = execFileSync(
  "git",
  ["ls-files", "-c", "-i", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);

const violations = ignoredTracked.filter((p) => !KNOWN_TRACKED_IGNORED.has(p));
if (violations.length) {
  failed = true;
  console.error(`✗ ${violations.length} tracked file(s) also ignored — untrack or fix:`);
  for (const p of violations) console.error(`  ${p}`);
} else {
  const known = ignoredTracked.length;
  console.log(
    `✓ no new tracked+ignored files (${known} known pre-existing: .swc, PR-2 scope)`,
  );
}

process.exit(failed ? 1 : 0);
