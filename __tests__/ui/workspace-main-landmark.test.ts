import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The root layout owns the single main landmark. WorkspaceShell is nested.
const source = (path: string) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("workspace document landmark and stage contracts", () => {
  it("keeps the main landmark in the root layout, not the nested shell", () => {
    const root = source("app/layout.tsx");
    const shell = source("components/live/WorkspaceShell.tsx");
    expect(root).toContain("<main className=");
    expect(root).toContain("</main>");
    expect(shell).toContain("<div ref={stageElRef}");
    expect(shell).not.toMatch(/<main\b|<\/main>/);
  });

  it("keeps sidebar, screenshot and E2E selectors aligned to the stage", () => {
    const sidebar = source("components/live/EditorialSidebar.tsx");
    const profile = source("components/profile-v2/ProfileWorkspace.tsx");
    const share = source("components/share/UnifiedShare.tsx");
    const e2e = source("scripts/e2e-phase3-profile.mjs");

    expect(sidebar.match(/\.lbw-root \.stagecol \.stage \.board/g)).toHaveLength(2);
    expect(profile).toContain('target=".stagecol .stage"');
    expect(share).toContain('screenshotTarget || ".stagecol .stage"');
    expect(e2e).toContain('document.querySelector(".stagecol .stage")');
    for (const file of [sidebar, profile, share, e2e]) {
      expect(file).not.toContain("main.stage");
    }

    const doc = document.implementation.createHTMLDocument("editorial-stage-test");
    doc.body.innerHTML = '<main><div class="lbw-root"><div class="stagecol"><div class="stage"><div class="board"><h2>Methods</h2></div></div></div></div></main>';
    expect(doc.querySelectorAll("main")).toHaveLength(1);
    expect(doc.querySelector(".lbw-root .stagecol .stage .board h2")?.textContent).toBe("Methods");
    expect(doc.querySelector(".stagecol .stage")).toBeTruthy();
  });
});
