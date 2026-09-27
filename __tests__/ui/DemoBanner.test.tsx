import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

/**
 * DemoBanner behavioral tests — the live-versus-seed contradiction fix.
 *
 * The banner calls the operator field "a curated seed" — directly
 * contradicting the live board's claimed-operator provenance. It must not
 * render on /board/* routes and must keep working (render + dismiss) on
 * every other surface. A source-text grep can't prove that — a broken
 * usePathname mock or a leaked suppression would pass it — so this renders
 * the real component with controlled pathnames.
 */

let currentPath = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
}));

// next/link works under jsdom but keeps this test focused on the banner.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { DemoBanner } from "@/components/ui/DemoBanner";

const SEED_COPY = /curated seed/i;

beforeEach(() => {
  currentPath = "/";
});

describe("DemoBanner — live-board suppression", () => {
  it("renders the seed banner on a reference surface", () => {
    currentPath = "/operators";
    render(<DemoBanner />);
    expect(screen.getByText(SEED_COPY)).toBeTruthy();
  });

  it("renders on the homepage", () => {
    currentPath = "/";
    render(<DemoBanner />);
    expect(screen.getByText(SEED_COPY)).toBeTruthy();
  });

  it("does NOT render on the all-time live board", () => {
    currentPath = "/board/all";
    const { container } = render(<DemoBanner />);
    expect(container.innerHTML).toBe("");
    expect(screen.queryByText(SEED_COPY)).toBeNull();
  });

  it("does NOT render on a bounded live-board window", () => {
    currentPath = "/board/30d";
    const { container } = render(<DemoBanner />);
    expect(container.innerHTML).toBe("");
    // No seed claim — and no dismiss affordance either.
    expect(screen.queryByLabelText(/dismiss/i)).toBeNull();
  });

  it("dismissal still works on non-board routes", () => {
    currentPath = "/compare";
    render(<DemoBanner />);
    fireEvent.click(screen.getByLabelText("Dismiss demo banner"));
    expect(screen.queryByText(SEED_COPY)).toBeNull();
  });
});
