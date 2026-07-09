/**
 * __tests__/contract/mcp-version-drift.test.mjs
 *
 * CROSS-REPO CONTRACT TEST — the MCP_VERSION + PLATFORM_COUNT drift guard.
 *
 * The web app (sigrank-app) hardcodes two constants that track the live MCP
 * package (sigrank-mcp):
 *   - MCP_VERSION   (lib/constants.ts)  → must match sigrank-mcp package.json version
 *   - PLATFORM_COUNT (lib/constants.ts)  → must match sigrank-mcp ALL_PLATFORMS.length
 *
 * If they drift, the web app shows stale install instructions + wrong platform
 * counts in marketing copy. This test catches it at PR time.
 *
 * In CI: the workflow checks out BOTH repos, then runs this script.
 * Locally: run with the other repo's root path as the first arg:
 *   node __tests__/contract/mcp-version-drift.test.mjs /path/to/sigrank-mcp
 */

import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Extract MCP_VERSION and PLATFORM_COUNT from the web app's constants.ts.
 */
function extractWebConstants(filePath) {
  const src = readFileSync(filePath, "utf8");

  const versionMatch = src.match(/MCP_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!versionMatch)
    throw new Error(`Could not extract MCP_VERSION from ${filePath}`);
  const mcpVersion = versionMatch[1];

  const countMatch = src.match(/PLATFORM_COUNT\s*=\s*(\d+)/);
  if (!countMatch)
    throw new Error(`Could not extract PLATFORM_COUNT from ${filePath}`);
  const platformCount = parseInt(countMatch[1], 10);

  return { mcpVersion, platformCount };
}

/**
 * Extract the version from the MCP repo's package.json.
 */
function extractMcpVersion(repoDir) {
  const pkg = JSON.parse(readFileSync(join(repoDir, "package.json"), "utf8"));
  if (!pkg.version)
    throw new Error(`No version field in ${repoDir}/package.json`);
  return pkg.version;
}

/**
 * Count ALL_PLATFORMS from the MCP's adapters.mjs by IMPORTING the module and
 * reading the real runtime array — exact truth, zero regex fragility.
 *
 * An earlier version text-scraped the ADAPTERS object + the `.concat([...])`
 * literal, which silently MISCOUNTED on plausible refactors: `concat`→spread
 * dropped the extras (15→13), and a comma inside a comment inflated the key count.
 * adapters.mjs has no top-level side effects and imports only node: builtins, so
 * importing it is safe even when the MCP repo's deps aren't installed (as in CI).
 */
async function extractMcpPlatformCount(repoDir) {
  const adaptersPath = join(repoDir, "adapters.mjs");
  const mod = await import(pathToFileURL(adaptersPath).href);
  if (!Array.isArray(mod.ALL_PLATFORMS)) {
    throw new Error(
      `adapters.mjs at ${adaptersPath} does not export an ALL_PLATFORMS array ` +
        `(got ${typeof mod.ALL_PLATFORMS}) — the MCP adapter registry may have ` +
        `been restructured. Update the extractor.`,
    );
  }
  return mod.ALL_PLATFORMS.length;
}

// ── Main ──────────────────────────────────────────────────────────────────

const selfRoot = resolve(__dirname, "..", "..");
const { mcpVersion: webVersion, platformCount: webCount } = extractWebConstants(
  join(selfRoot, "lib/constants.ts"),
);

const otherRoot = process.argv[2] || process.env.OTHER_REPO_ROOT;

if (!otherRoot) {
  console.error(
    "✓ CROSS-REPO CONTRACT TEST (mcp-version): missing other repo path.\n" +
      "  Pass it as arg: node __tests__/contract/mcp-version-drift.test.mjs /path/to/sigrank-mcp\n" +
      "  Or set OTHER_REPO_ROOT env var (CI sets this).\n" +
      "  Skipping (not a failure — run in CI where both repos are checked out).",
  );
  process.exit(0);
}

const mcpActualVersion = extractMcpVersion(otherRoot);
const mcpActualCount = await extractMcpPlatformCount(otherRoot);

let failed = false;

// ── Version check ──────────────────────────────────────────────────────────
if (webVersion === mcpActualVersion) {
  console.log(
    `✓ MCP_VERSION: web "${webVersion}" matches MCP package.json "${mcpActualVersion}"`,
  );
} else {
  console.error(
    `✗ MCP_VERSION DRIFT: web says "${webVersion}" but MCP package.json says "${mcpActualVersion}"\n` +
      `  FIX: update lib/constants.ts → MCP_VERSION to "${mcpActualVersion}"`,
  );
  failed = true;
}

// ── Platform count check ──────────────────────────────────────────────────
if (webCount === mcpActualCount) {
  console.log(
    `✓ PLATFORM_COUNT: web ${webCount} matches MCP ALL_PLATFORMS.length ${mcpActualCount}`,
  );
} else {
  console.error(
    `✗ PLATFORM_COUNT DRIFT: web says ${webCount} but MCP ALL_PLATFORMS has ${mcpActualCount}\n` +
      `  FIX: update lib/constants.ts → PLATFORM_COUNT to ${mcpActualCount}`,
  );
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log(
    `✓ CROSS-REPO CONTRACT TEST (mcp-version): all constants match.\n` +
      `  web (${selfRoot}): MCP_VERSION="${webVersion}", PLATFORM_COUNT=${webCount}\n` +
      `  mcp  (${otherRoot}): version="${mcpActualVersion}", ALL_PLATFORMS.length=${mcpActualCount}`,
  );
  process.exit(0);
}
