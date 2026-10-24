import type React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/hall",
}));

vi.mock("@/components/live/fonts", () => ({ lbwFontVars: "" }));

// Surface next/link's prefetch prop so the test can see it.
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children: React.ReactNode }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

import { WorkspaceShell } from "@/components/live/WorkspaceShell";

afterEach(cleanup);

describe("ORIGINAL BOARD entry point", () => {
  it("the shell footer links to /board/history", () => {
    render(
      <WorkspaceShell active="hall" title="T">
        <p>stage</p>
      </WorkspaceShell>,
    );
    const link = screen.getByRole("link", { name: "ORIGINAL BOARD" });
    expect(link.getAttribute("href")).toBe("/board/history");
    // The archive page is ~1.2 MB of RSC; the always-visible footer must not prefetch it.
    expect(link.getAttribute("data-prefetch")).toBe("false");
  });
});
