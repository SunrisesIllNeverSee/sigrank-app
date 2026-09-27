#!/usr/bin/env node
/**
 * scripts/check-broken-symlinks.mjs — repo hygiene check.
 *
 * Fails (exit 1) if any TRACKED symlink points at a missing target.
 * Added 2026-09-27 after the tiun-sdk uninstall left 52 broken alias
 * symlinks tracked at the repo root (REPO_CLEANUP_PLAN §16.1).
 *
 * Usage: node scripts/check-broken-symlinks.mjs
 * Wire into CI or `npm run verify` when the CI decision (Phase 3) lands.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const out = execFileSync("git", ["ls-files", "-s"], { encoding: "utf8" });
const symlinks = out
  .split("\n")
  .filter((l) => l.startsWith("120000 "))
  .map((l) => l.split("\t")[1]);

const broken = symlinks.filter((p) => !existsSync(p));

if (broken.length) {
  console.error(`✗ ${broken.length} broken tracked symlink(s):`);
  for (const p of broken) {
    let target = "";
    try {
      target = execFileSync("readlink", [p], { encoding: "utf8" }).trim();
    } catch {}
    console.error(`  ${p} -> ${target || "(unreadable)"}`);
  }
  process.exit(1);
}
console.log(`✓ ${symlinks.length} tracked symlinks, all resolve`);
