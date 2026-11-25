// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { TOOLS, REMOTE_TOOL_COUNT } from "@/lib/mcp/tools";

describe("site copy quotes the real remote tool count", () => {
  it("REMOTE_TOOL_COUNT is the registry length", () => {
    expect(REMOTE_TOOL_COUNT).toBe(TOOLS.length);
  });
  it("/pricing and /mcp derive the number from code, no hard-coded count", () => {
    for (const f of ["app/pricing/page.tsx", "app/mcp/page.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).toContain("REMOTE_TOOL_COUNT");
      expect(src).not.toMatch(/\b\d+ remote tools/);
      expect(src).not.toMatch(/, 3 tools,/);
    }
  });
});
