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
 * Usage: node scripts/check-repo-hygiene.mjs  (works from any subdirectory —
 * git commands are anchored to the repo root so subdirectory invocation can't
 * silently under-scope the scan)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", cwd: root });

/** Known tracked+ignored files — PR-2 scope (.swc binary untrack). Do NOT add
 *  new entries; a new violation should fail the check and be fixed instead.
 *  (Only the wasmer binary is tracked — .swc/.gitignore exists on disk but is
 *  untracked, so it must NOT be allowlisted here.) */
const KNOWN_TRACKED_IGNORED = new Set([
  ".swc/plugins/macos_aarch64_22.0.1/6ea9d3dec20e87696401db15d4c456817f842cb74b13af645633912dceb61bd5.wasmer-v7",
]);

let failed = false;

// ── Check 1: broken tracked symlinks ─────────────────────────────────────
// -z: NUL-separated output — default quoting would wrap special filenames in
// quotes and existsSync() on the literal would false-positive as "broken".
const symlinks = git(["ls-files", "-s", "-z"])
  .split("\0")
  .filter((l) => l.startsWith("120000 "))
  .map((l) => l.split("\t")[1])
  .filter(Boolean);

const broken = symlinks.filter((p) => !existsSync(resolve(root, p)));
if (broken.length) {
  failed = true;
  console.error(`✗ ${broken.length} broken tracked symlink(s):`);
  for (const p of broken) {
    let target = "";
    try {
      target = readlinkSync(resolve(root, p));
    } catch {}
    console.error(`  ${p} -> ${target || "(unreadable)"}`);
  }
} else {
  console.log(`✓ ${symlinks.length} tracked symlinks, all resolve`);
}

// ── Check 2: tracked-but-ignored files ───────────────────────────────────
const ignoredTracked = git(["ls-files", "-c", "-i", "-z", "--exclude-standard"])
  .split("\0")
  .filter(Boolean);

const violations = ignoredTracked.filter((p) => !KNOWN_TRACKED_IGNORED.has(p));
if (violations.length) {
  failed = true;
  console.error(`✗ ${violations.length} tracked file(s) also ignored — untrack or fix:`);
  for (const p of violations) console.error(`  ${p}`);
} else {
  console.log(
    `✓ no new tracked+ignored files (${ignoredTracked.length} known pre-existing: .swc, PR-2 scope)`,
  );
}

process.exit(failed ? 1 : 0);
