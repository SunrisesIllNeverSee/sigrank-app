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
 * Check 3 — Public schema copies must byte-match their sources (added PR-5):
 *   Two schema pairs are duplicated source→public for static serving. Sync was
 *   manual and had silently drifted three times (see "synchronize public schema
 *   artifact" fix-commits). Byte-equality is now enforced here so a forgotten
 *   copy step fails hygiene instead of shipping a stale public contract.
 *
 * Usage: node scripts/check-repo-hygiene.mjs  (works from any subdirectory —
 * git commands are anchored to the repo root so subdirectory invocation can't
 * silently under-scope the scan)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const git = (args) =>
  execFileSync("git", args, { encoding: "utf8", cwd: root });

/** Known tracked+ignored files — must stay EMPTY. The .swc wasmer binary was
 *  untracked in PR-2; .swc/.gitignore exists on disk but is untracked, so it
 *  must NOT be allowlisted here. Do NOT add new entries — a new violation
 *  should fail the check and be fixed instead. */
const KNOWN_TRACKED_IGNORED = new Set([]);

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
    } catch {
      // target stays "" — reported as "(unreadable)" below
    }
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
    `✓ ${ignoredTracked.length} tracked+ignored files (0 new violations)`,
  );
}

// ── Check 3: public schema copies byte-match their sources ──────────────
// [source, publicCopy] — edit the SOURCE, then `cp` it to the public path.
const SCHEMA_PAIRS = [
  ["lib/exchange-gateway/exchange.schema.json", "public/exchange.schema.json"],
  [
    "standard/schema/sigrank-operator-record-v0.1.schema.json",
    "public/standard/sigrank-operator-record-v0.1.schema.json",
  ],
];

const drifted = SCHEMA_PAIRS.filter(([src, pub]) => {
  const s = resolve(root, src);
  const p = resolve(root, pub);
  return (
    !existsSync(s) ||
    !existsSync(p) ||
    !readFileSync(s).equals(readFileSync(p))
  );
});
if (drifted.length) {
  failed = true;
  console.error("✗ public schema copy out of sync with source:");
  for (const [src, pub] of drifted) {
    console.error(`  ${src}  →  ${pub}`);
  }
  console.error(
    "  fix: edit the source (left), then `cp <source> <public path>` — the public copy is served verbatim",
  );
} else {
  console.log(`✓ ${SCHEMA_PAIRS.length} public schema copies match sources`);
}

process.exit(failed ? 1 : 0);
