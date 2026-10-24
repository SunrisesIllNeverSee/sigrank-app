import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/hall",
}));

vi.mock("@/components/live/fonts", () => ({ lbwFontVars: "" }));

import { WorkspaceShell } from "@/components/live/WorkspaceShell";

afterEach(cleanup);

describe("ORIGINAL BOARD entry point", () => {
  it("the shell footer links to /board/history", () => {
    render(
      <WorkspaceShell active="hall" title="T">
        <p>stage</p>
      </WorkspaceShell>,
    );
    expect(screen.getByRole("link", { name: "ORIGINAL BOARD" }).getAttribute("href")).toBe("/board/history");
  });
});
