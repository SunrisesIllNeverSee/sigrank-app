/**
 * __tests__/seo/cli-commands.test.mjs
 *
 * Site copy must only tell readers to run SigRank CLI commands that exist.
 *
 * The CLI (sigrank-mcp, presentation/cli.mjs) dispatches these subcommands:
 * board, compare, tui, watch, proxy, enroll, submit, help, start, run.
 * Anything else exits with "unknown command". `sigrank me` and `sigrank init`
 * were removed; pages kept telling readers to run them until 2026-11-11.
 * If the CLI gains or drops a subcommand, update CLI_SUBCOMMANDS here.
 *
 * Also pins the enroll/submit steps on /llms.txt and /llms-full.txt so the
 * agent-facing setup text can't drift back to the old flow.
 *
 *   node --experimental-strip-types --test __tests__/seo/cli-commands.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SCAN_DIRS = ["app", "lib", "components"];

const CLI_SUBCOMMANDS = new Set([
  "board",
  "compare",
  "tui",
  "watch",
  "proxy",
  "enroll",
  "submit",
  "help",
  "start",
  "run",
]);

// Command-shaped mentions only, so prose like "the sigrank CLI" is ignored:
//   inline code    `sigrank submit` / `npx sigrank enroll`
//   code blocks    a line that starts with the command, then a comment, flag or end
//   <code> tags    <code ...>sigrank submit
const COMMAND_PATTERNS = [
  /`(?:npx )?sigrank(?:@latest)? ([a-z][a-z-]*)/g,
  /^\s*(?:\{`)?(?:npx )?sigrank(?:@latest)? ([a-z][a-z-]*)(?=[ \t]*(?:$|#|--|`))/gm,
  /<code[^>]*>\s*(?:\{`)?(?:npx )?sigrank(?:@latest)? ([a-z][a-z-]*)/g,
];

// Removed subcommands are rejected in any shape (plain strings, <span>, prose),
// across page source and the files served from public/.
const REMOVED = /\bsigrank (me|init)\b/g;
const SERVED_DIRS = [...SCAN_DIRS, "public"];

async function* sourceFiles(dir, ext = /\.(ts|tsx)$/) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(path, ext);
    else if (ext.test(entry.name)) yield path;
  }
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

test("site copy names only CLI subcommands that exist", async () => {
  const bad = [];
  let seen = 0;
  for (const dir of SCAN_DIRS) {
    for await (const file of sourceFiles(join(ROOT, dir))) {
      const text = await readFile(file, "utf8");
      for (const pattern of COMMAND_PATTERNS) {
        for (const m of text.matchAll(pattern)) {
          seen++;
          if (!CLI_SUBCOMMANDS.has(m[1])) {
            bad.push(`${relative(ROOT, file)}:${lineOf(text, m.index)} sigrank ${m[1]}`);
          }
        }
      }
    }
  }
  assert.ok(seen > 50, `expected to find CLI mentions to check, found ${seen}`);
  assert.deepEqual(bad, [], `unknown CLI subcommands in site copy:\n${bad.join("\n")}`);
});

test("removed CLI subcommands appear nowhere in served copy", async () => {
  const bad = [];
  for (const dir of SERVED_DIRS) {
    for await (const file of sourceFiles(join(ROOT, dir), /\.(ts|tsx|mdx?|txt|json|html)$/)) {
      const text = await readFile(file, "utf8");
      for (const m of text.matchAll(REMOVED)) {
        bad.push(`${relative(ROOT, file)}:${lineOf(text, m.index)} ${m[0]}`);
      }
    }
  }
  assert.deepEqual(bad, [], `removed CLI subcommands in served copy:\n${bad.join("\n")}`);
});

for (const route of ["app/llms.txt/route.ts", "app/llms-full.txt/route.ts"]) {
  test(`${route} describes the connect-code enroll flow`, async () => {
    const text = await readFile(join(ROOT, route), "utf8");
    assert.match(text, /connect code/i);
    assert.match(text, /sigrank enroll/);
    assert.match(text, /sigrank submit --dry-run/);
    assert.match(text, /cache_write/);
    for (const stale of ["only four numbers", "No account required", "No install, no sign-in"]) {
      assert.ok(!text.includes(stale), `${route} still says "${stale}"`);
    }
  });
}


test("comparison FAQ snippets use commands executable without a global install", async () => {
  const bad = [];
  const answerRE = /answer:\s*"(?:\\.|[^"\\])*"/g;
  for await (const file of sourceFiles(join(ROOT, "app/vs"))) {
    const source = await readFile(file, "utf8");
    for (const answer of source.matchAll(answerRE)) {
      // An FAQ explicitly instructing a global install may use the bare binary.
      if (answer[0].includes("npm install -g sigrank")) continue;
      for (const cmd of answer[0].matchAll(/\bsigrank (enroll|submit)\b/g)) {
        const prefix = answer[0].slice(Math.max(0, cmd.index - 4), cmd.index);
        if (!prefix.endsWith("npx ")) {
          bad.push(relative(ROOT, file) + ":" + lineOf(source, answer.index) + " " + cmd[0]);
        }
      }
    }
  }
  assert.deepEqual(bad, [], "FAQ commands require a missing global install:\n" + bad.join("\n"));
});

test("global install code snippets preview before publishing", async () => {
  let checked = 0;
  const backtick = String.fromCharCode(96);
  for await (const file of sourceFiles(join(ROOT, "app/vs"))) {
    const source = await readFile(file, "utf8");
    for (const part of source.split("npm install -g sigrank").slice(1)) {
      const end = part.indexOf(backtick + "}");
      if (end < 0) continue;
      const snippet = part.slice(0, end);
      if (!snippet.includes("sigrank enroll") || !snippet.includes("sigrank submit")) continue;
      checked++;
      assert.match(snippet, /sigrank submit --dry-run/,
        relative(ROOT, file) + " must preview first");
      assert.ok(
        snippet.indexOf("sigrank enroll") < snippet.indexOf("sigrank submit --dry-run") &&
        snippet.indexOf("sigrank submit --dry-run") < snippet.lastIndexOf("sigrank submit"),
        relative(ROOT, file) + " must enroll, preview, then publish"
      );
    }
  }
  assert.ok(checked >= 20, "expected global-install examples; checked " + checked);
});

test("benchmark and yield guides explain web enrollment, preview, and Claude default", async () => {
  for (const route of [
    "app/blog/how-to-benchmark-ai-coding-workflow/page.tsx",
    "app/guides/how-to-benchmark-ai-coding-workflow/page.tsx",
    "app/guides/how-to-improve-your-yield/page.tsx",
    "app/guides/how-to-track-token-cascade/page.tsx",
  ]) {
    const s = await readFile(join(ROOT, route), "utf8");
    assert.match(s, /connect code/i, route + " omits a web connect code");
    assert.match(s, /npx sigrank enroll/, route + " omits device enrollment");
    assert.match(s, /npx sigrank submit --dry-run/, route + " omits the preview");
    assert.match(s, /npx sigrank submit/, route + " omits publishing");
    assert.match(s, /Claude by default|default submission source is Claude/i,
      route + " omits the CLI default source");
  }
});

test("FAQ comparisons do not promise direct logs from unregistered adapters", async () => {
  for (const slug of [
    "aider", "amazon-q", "cline", "continue", "cursor",
    "roo-code", "sourcegraph-cody", "tabnine", "windsurf", "zed",
  ]) {
    const route = "app/vs/" + slug + "/page.tsx";
    const s = await readFile(join(ROOT, route), "utf8");
    assert.match(s, /no dedicated .* log adapter/i, route + " omits adapter limitation");
    assert.doesNotMatch(s, /The SigRank CLI reads token telemetry from/i,
      route + " falsely promises a dedicated local reader");
  }
});
