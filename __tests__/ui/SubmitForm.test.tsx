import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/submit",
}));

import { SubmitForm } from "@/components/submit/SubmitForm";

describe("SubmitForm", () => {
  it("renders a form with a submit button", () => {
    render(<SubmitForm />);
    // SubmitForm renders a <form> with a submit button
    const form = document.querySelector("form");
    expect(form).not.toBeNull();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("renders all metric input fields", () => {
    render(<SubmitForm />);
    // The codename field is required and labeled
    expect(screen.getByLabelText(/codename/i)).toBeInTheDocument();
    // A platform selector is present
    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
  });
});
