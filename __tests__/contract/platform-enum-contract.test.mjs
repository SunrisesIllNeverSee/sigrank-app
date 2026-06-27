/**
 * __tests__/contract/platform-enum-contract.test.mjs
 *
 * CROSS-REPO CONTRACT TEST — the codex-landing guard.
 *
 * The MCP server (sigrank-mcp) and the web app (sigrank-app) each maintain a
 * platform enum. If they drift (one repo accepts a platform the other doesn't),
 * submissions silently fail — the codex landing was triple-blocked by exactly
 * this drift. This test catches it at PR time.
 *
 * In CI: the workflow checks out BOTH repos (self + the other), then runs this
 * script. It extracts the enum from each repo's file and diffs them.
 *
 * Locally: run with the other repo's root path as the first arg:
 *   node __tests__/contract/platform-enum-contract.test.mjs /path/to/the/other/repo
 *
 * The two enum sources:
 *   sigrank-app:  lib/payload/schema.ts  →  platformPrimaryEnum (zod enum)
 *   sigrank-mcp:  submit.mjs             →  PLATFORM_ENUM (Set)
 */

import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Extract the platform enum from the web app's schema.ts (zod enum).
 * Matches: z.enum(['claude', 'chatgpt', ...])
 */
function extractWebEnum(filePath) {
  const src = readFileSync(filePath, 'utf8')
  // Match the z.enum([...]) call for platformPrimaryEnum
  const match = src.match(/platformPrimaryEnum\s*=\s*z\.enum\(\s*\[([\s\S]*?)\]\s*\)/)
  if (!match) throw new Error(`Could not extract platformPrimaryEnum from ${filePath}`)
  const items = match[1]
    .split(',')
    .map((s) => s.trim().replace(/['"`]/g, ''))
    .filter(Boolean)
  return new Set(items)
}

/**
 * Extract the platform enum from the MCP's submit.mjs (Set constructor).
 * Matches: new Set(['claude', 'chatgpt', ...])
 */
function extractMcpEnum(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const match = src.match(/PLATFORM_ENUM\s*=\s*new Set\(\s*\[([\s\S]*?)\]\s*\)/)
  if (!match) throw new Error(`Could not extract PLATFORM_ENUM from ${filePath}`)
  const items = match[1]
    .split(',')
    .map((s) => s.trim().replace(/['"`]/g, ''))
    .filter(Boolean)
  return new Set(items)
}

/**
 * Detect which repo we're in by looking for the marker files.
 * sigrank-app has `lib/payload/schema.ts`; sigrank-mcp has `submit.mjs`.
 */
function detectRepo(rootDir) {
  try {
    readFileSync(join(rootDir, 'lib/payload/schema.ts'), 'utf8')
    return 'web'
  } catch {
    try {
      readFileSync(join(rootDir, 'submit.mjs'), 'utf8')
      return 'mcp'
    } catch {
      throw new Error(`Could not detect repo type at ${rootDir} (no schema.ts or submit.mjs)`)
    }
  }
}

/**
 * Get the platform enum from a repo at the given path.
 */
function getEnumForRepo(repoDir) {
  const type = detectRepo(repoDir)
  if (type === 'web') {
    return extractWebEnum(join(repoDir, 'lib/payload/schema.ts'))
  } else {
    return extractMcpEnum(join(repoDir, 'submit.mjs'))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

// This repo's root (parent of __tests__/contract/)
const selfRoot = resolve(__dirname, '..', '..')
const selfType = detectRepo(selfRoot)
const selfEnum = getEnumForRepo(selfRoot)

// The other repo's root: either from CLI arg (local) or from CI env var
const otherRoot = process.argv[2] || process.env.OTHER_REPO_ROOT

if (!otherRoot) {
  console.error(
    '✗ CROSS-REPO CONTRACT TEST: missing other repo path.\n' +
      '  Pass it as arg: node __tests__/contract/platform-enum-contract.test.mjs /path/to/other/repo\n' +
      '  Or set OTHER_REPO_ROOT env var (CI sets this).\n' +
      '  Skipping (not a failure — run in CI where both repos are checked out).',
  )
  process.exit(0) // Don't fail when run locally without the other repo
}

const otherType = detectRepo(otherRoot)
if (otherType === selfType) {
  console.error(
    `✗ CROSS-REPO CONTRACT TEST: both repos are type "${selfType}" — need one web + one mcp.\n` +
      `  self: ${selfRoot} (${selfType})\n` +
      `  other: ${otherRoot} (${otherType})`,
  )
  process.exit(1)
}

const otherEnum = getEnumForRepo(otherRoot)

// Diff the two enums
const selfOnly = [...selfEnum].filter((p) => !otherEnum.has(p))
const otherOnly = [...otherEnum].filter((p) => !selfEnum.has(p))

if (selfOnly.length === 0 && otherOnly.length === 0) {
  console.log(
    `✓ CROSS-REPO CONTRACT TEST: platform enums match (${selfEnum.size} platforms).\n` +
      `  ${selfType} (${selfRoot}): [${[...selfEnum].join(', ')}]\n` +
      `  ${otherType} (${otherRoot}): [${[...otherEnum].join(', ')}]`,
  )
  process.exit(0)
} else {
  console.error(
    `✗ CROSS-REPO CONTRACT TEST: platform enums DRIFTED!\n` +
      `  ${selfType} (${selfRoot}): [${[...selfEnum].join(', ')}]\n` +
      `  ${otherType} (${otherRoot}): [${[...otherEnum].join(', ')}]\n` +
      (selfOnly.length > 0 ? `  Only in ${selfType}: [${selfOnly.join(', ')}]\n` : '') +
      (otherOnly.length > 0 ? `  Only in ${otherType}: [${otherOnly.join(', ')}]\n` : '') +
      `\n  FIX: add the missing platform(s) to BOTH repos before merging.\n` +
      `  sigrank-app:  lib/payload/schema.ts  →  platformPrimaryEnum\n` +
      `  sigrank-mcp:  submit.mjs             →  PLATFORM_ENUM\n` +
      `  Also update: lib/canon/ids.ts (P.xx ID) + lib/constants.ts (PLATFORM_UI) + globals.css (--platform-xxx)`,
  )
  process.exit(1)
}
