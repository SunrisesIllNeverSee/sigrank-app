import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/hall",
}));

vi.mock("@/components/live/fonts", () => ({ lbwFontVars: "" }));

import { WorkspaceShell } from "@/components/live/WorkspaceShell";

afterEach(cleanup);

describe("WorkspaceShell panel collapse", () => {
  it("collapses on keyboard activation of HIDE and moves focus to the reopen tab, then back", () => {
    render(
      <WorkspaceShell active="hall" title="T" leftTitle="PROFILE · DRILL" left={<p>L</p>} rightTitle="OP" right={<p>R</p>}>
        <p>stage</p>
      </WorkspaceShell>,
    );
    const hide = screen.getByRole("button", { name: /collapse left sidebar/i });
    fireEvent.click(hide, { detail: 0 }); // keyboard Enter/Space
    const tab = screen.getByRole("button", { name: "Show PROFILE · DRILL panel" });
    expect(tab.getAttribute("aria-controls")).toBeNull();
    expect(document.activeElement).toBe(tab);
    expect(screen.queryByRole("button", { name: /collapse left sidebar/i })).toBeNull();
    fireEvent.click(tab);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /collapse left sidebar/i }));
  });
});
