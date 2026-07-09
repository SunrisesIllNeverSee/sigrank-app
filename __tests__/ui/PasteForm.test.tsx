import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/submit",
}));

import { PasteForm } from "@/components/submit/PasteForm";

describe("PasteForm", () => {
  it("renders without crashing", () => {
    render(<PasteForm />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
