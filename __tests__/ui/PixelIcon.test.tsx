import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { PixelIcon } from "@/components/live/PixelIcon";
import type { PixelIconName } from "@/components/live/PixelIcon";

const ALL: PixelIconName[] = [
  "board",
  "compare",
  "hall",
  "field",
  "wiki",
  "blog",
  "enterprise",
];

describe("PixelIcon", () => {
  it("renders a 5x5 grid (25 cells) for every named pattern", () => {
    for (const name of ALL) {
      const { container, unmount } = render(<PixelIcon name={name} />);
      const cells = container.querySelectorAll(".pxic i");
      expect(cells.length).toBe(25);
      // every pattern has at least one lit cell
      expect(container.querySelectorAll(".pxic i.lit").length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("each icon pattern is visually distinct", () => {
    const html = new Set(
      ALL.map(
        (name) => render(<PixelIcon name={name} />).container.innerHTML,
      ),
    );
    expect(html.size).toBe(ALL.length);
  });

  it("marks itself decorative (aria-hidden) for the icon rail", () => {
    const { container } = render(<PixelIcon name="board" />);
    expect(container.querySelector(".pxic")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("returns null for an unknown name instead of silently substituting", () => {
    // @ts-expect-error — deliberate misuse test
    const { container } = render(<PixelIcon name="nope" />);
    expect(container.innerHTML).toBe("");
  });
});
