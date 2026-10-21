import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RailDialog } from "@/components/profile-v2/RailDialog";

beforeAll(() => {
  // jsdom lacks dialog modal support.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
});

describe("RailDialog", () => {
  it("mounts lazy children only while open and reports onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <RailDialog title="MOVERS" trigger={<span>top</span>} lazy hint="OPEN ▸" onOpenChange={onOpenChange}>
        {(close) => <button onClick={close}>full list</button>}
      </RailDialog>,
    );
    expect(screen.queryByText("full list")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "MOVERS — open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByText("full list", { selector: "button" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText("full list")).toBeNull();
  });

  it("uses an explicit triggerLabel when given", () => {
    render(<RailDialog title="X" trigger={<span>t</span>} triggerLabel="Open the X panel">body</RailDialog>);
    expect(screen.getByRole("button", { name: "Open the X panel" })).toBeTruthy();
  });
});
