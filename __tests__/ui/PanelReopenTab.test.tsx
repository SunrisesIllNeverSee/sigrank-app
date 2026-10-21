import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelReopenTab } from "@/components/live/PanelReopenTab";

describe("PanelReopenTab", () => {
  it("is a collapsed-state toggle button that reopens its panel", () => {
    const onOpen = vi.fn();
    render(<PanelReopenTab side="l" label="SIDEBAR" controls="lbw-left-panel" onOpen={onOpen} />);
    const btn = screen.getByRole("button", { name: "show sidebar panel" });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-controls")).toBe("lbw-left-panel");
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
