import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/score",
}));

import { ScorePasteCard } from "@/components/score/ScorePasteCard";

describe("ScorePasteCard", () => {
  it("renders without crashing", () => {
    render(<ScorePasteCard />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("shows a preview/parse button", () => {
    render(<ScorePasteCard />);
    // The paste card's primary action is "Parse & preview" — assert by
    // accessible name so the test fails if the parse action is removed
    // or relabeled to something unrelated.
    expect(
      screen.getByRole("button", { name: /preview|parse|calculate/i }),
    ).toBeInTheDocument();
  });
});
