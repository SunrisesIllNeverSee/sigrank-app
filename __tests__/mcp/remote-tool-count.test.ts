// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TOOLS, REMOTE_TOOL_COUNT } from "@/lib/mcp/tools";

const root = resolve(__dirname, "..", "..");
const read = (f: string) => readFileSync(resolve(root, f), "utf8");

describe("site copy quotes the real remote tool count", () => {
  it("REMOTE_TOOL_COUNT is the registry length", () => {
    expect(REMOTE_TOOL_COUNT).toBe(TOOLS.length);
  });
  it("/pricing, /mcp and acp.json derive the number from code, no hard-coded count", () => {
    for (const f of ["app/pricing/page.tsx", "app/mcp/page.tsx", "app/.well-known/acp.json/route.ts"]) {
      const src = read(f);
      expect(src, f).toContain("REMOTE_TOOL_COUNT");
      expect(src, f).not.toMatch(/\b\d+ remote (MCP )?tools\b/);
      expect(src, f).not.toMatch(/\b1[0-9] MCP tools\b/);
      expect(src, f).not.toMatch(/, 3 tools,/);
    }
  });
  it("public discovery files and README do not hard-code a wrong remote tool count", () => {
    for (const f of ["public/llms.txt", "public/llms-full.txt", "README.md"]) {
      let src: string;
      try { src = read(f); } catch { continue; }
      for (const m of src.matchAll(/\b(\d+) remote (?:MCP )?tools\b/gi)) {
        expect(Number(m[1]), `${f}: ${m[0]}`).toBe(REMOTE_TOOL_COUNT);
      }
    }
  });
});
