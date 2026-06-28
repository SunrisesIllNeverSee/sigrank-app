/**
 * __tests__/contract/window-enum-contract.test.mjs
 *
 * CROSS-REPO CONTRACT TEST — the window-type drift guard.
 *
 * Sibling of platform-enum-contract.test.mjs. The MCP server (sigrank-mcp) and
 * the web app (sigrank-app) each maintain a window_type enum. If they drift
 * (one repo accepts a window the other doesn't), submissions silently bucket
 * into the wrong board window. This test catches it at PR time.
 *
 * In CI: the workflow checks out BOTH repos (self + the other), then runs this
 * script. It extracts the window enum from each repo's file and diffs them.
 *
 * Locally: run with the other repo's root path as the first arg:
 *   node __tests__/contract/window-enum-contract.test.mjs /path/to/the/other/repo
 *
 * The two window sources:
 *   sigrank-app:  lib/constants.ts        →  WINDOW_API_MAP (values = window_type enums)
 *   sigrank-mcp:  submit.mjs              →  WINDOW_TYPE (values = window_type enums)
 */

import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Extract the window_type enum from the web app's constants.ts.
 * Matches: WINDOW_API_MAP: Record<WindowUI, string> = { Daily: '7d', '30': '30d', ... }
 * We want the VALUES (the API/DB window_type strings), not the UI labels.
 */
function extractWebWindows(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const match = src.match(/WINDOW_API_MAP\s*[^=]*=\s*\{([\s\S]*?)\}/)
  if (!match) throw new Error(`Could not extract WINDOW_API_MAP from ${filePath}`)
  const body = match[1]
  // Match value strings: key: 'value' or key: "value"
  const valueMatches = [...body.matchAll(/:\s*["']([^"']+)["']/g)]
  const items = valueMatches.map((m) => m[1].trim()).filter(Boolean)
  // Silent-empty guard: the outer regex matched the block but no quoted values
  // were found. Without this, a format change on BOTH repos in the same PR would
  // yield two empty sets that trivially "match" → a false PASS. Fail loudly instead.
  if (items.length === 0) {
    throw new Error(
      `Extracted zero window_type values from ${filePath} — the source format ` +
        `may have changed (block matched, but no quoted values). Update the extractor.`,
    )
  }
  return new Set(items)
}

/**
 * Extract the window_type enum from the MCP's submit.mjs.
 * Matches: WINDOW_TYPE = { '7d': '7d', '30d': '30d', '90d': '90d', all: 'all_time' }
 * We want the VALUES (the window_type strings sent to the API).
 */
function extractMcpWindows(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const match = src.match(/WINDOW_TYPE\s*=\s*\{([\s\S]*?)\}/)
  if (!match) throw new Error(`Could not extract WINDOW_TYPE from ${filePath}`)
  const body = match[1]
  const valueMatches = [...body.matchAll(/:\s*["']([^"']+)["']/g)]
  const items = valueMatches.map((m) => m[1].trim()).filter(Boolean)
  // Silent-empty guard: the outer regex matched the block but no quoted values
  // were found. Without this, a format change on BOTH repos in the same PR would
  // yield two empty sets that trivially "match" → a false PASS. Fail loudly instead.
  if (items.length === 0) {
    throw new Error(
      `Extracted zero window_type values from ${filePath} — the source format ` +
        `may have changed (block matched, but no quoted values). Update the extractor.`,
    )
  }
  return new Set(items)
}

/**
 * Detect which repo we're in by looking for the marker files.
 * sigrank-app has `lib/constants.ts`; sigrank-mcp has `submit.mjs`.
 */
function detectRepo(rootDir) {
  try {
    readFileSync(join(rootDir, 'lib/constants.ts'), 'utf8')
    return 'web'
  } catch {
    try {
      readFileSync(join(rootDir, 'submit.mjs'), 'utf8')
      return 'mcp'
    } catch {
      throw new Error(`Could not detect repo type at ${rootDir} (no constants.ts or submit.mjs)`)
    }
  }
}

/**
 * Get the window enum from a repo at the given path.
 */
function getWindowsForRepo(repoDir) {
  const type = detectRepo(repoDir)
  if (type === 'web') {
    return extractWebWindows(join(repoDir, 'lib/constants.ts'))
  } else {
    return extractMcpWindows(join(repoDir, 'submit.mjs'))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

const selfRoot = resolve(__dirname, '..', '..')
const selfType = detectRepo(selfRoot)
const selfWindows = getWindowsForRepo(selfRoot)

const otherRoot = process.argv[2] || process.env.OTHER_REPO_ROOT

if (!otherRoot) {
  console.error(
    '✓ CROSS-REPO CONTRACT TEST (windows): missing other repo path.\n' +
      '  Pass it as arg: node __tests__/contract/window-enum-contract.test.mjs /path/to/other/repo\n' +
      '  Or set OTHER_REPO_ROOT env var (CI sets this).\n' +
      '  Skipping (not a failure — run in CI where both repos are checked out).',
  )
  process.exit(0)
}

const otherType = detectRepo(otherRoot)
if (otherType === selfType) {
  console.error(
    `✗ CROSS-REPO CONTRACT TEST (windows): both repos are type "${selfType}" — need one web + one mcp.\n` +
      `  self: ${selfRoot} (${selfType})\n` +
      `  other: ${otherRoot} (${otherType})`,
  )
  process.exit(1)
}

const otherWindows = getWindowsForRepo(otherRoot)

const selfOnly = [...selfWindows].filter((w) => !otherWindows.has(w))
const otherOnly = [...otherWindows].filter((w) => !selfWindows.has(w))

if (selfOnly.length === 0 && otherOnly.length === 0) {
  console.log(
    `✓ CROSS-REPO CONTRACT TEST (windows): window_type enums match (${selfWindows.size} windows).\n` +
      `  ${selfType} (${selfRoot}): [${[...selfWindows].join(', ')}]\n` +
      `  ${otherType} (${otherRoot}): [${[...otherWindows].join(', ')}]`,
  )
  process.exit(0)
} else {
  console.error(
    `✗ CROSS-REPO CONTRACT TEST (windows): window_type enums DRIFTED!\n` +
      `  ${selfType} (${selfRoot}): [${[...selfWindows].join(', ')}]\n` +
      `  ${otherType} (${otherRoot}): [${[...otherWindows].join(', ')}]\n` +
      (selfOnly.length > 0 ? `  Only in ${selfType}: [${selfOnly.join(', ')}]\n` : '') +
      (otherOnly.length > 0 ? `  Only in ${otherType}: [${otherOnly.join(', ')}]\n` : '') +
      `\n  FIX: add the missing window(s) to BOTH repos before merging.\n` +
      `  sigrank-app:  lib/constants.ts  →  WINDOW_API_MAP (values)\n` +
      `  sigrank-mcp:  submit.mjs        →  WINDOW_TYPE (values)`,
  )
  process.exit(1)
}
