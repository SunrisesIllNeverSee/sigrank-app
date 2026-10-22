import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OperatorSearchSelect } from "@/components/compare/OperatorSearchSelect";

const options = [
  { codename: "operator-a", label: "Alpha" },
  { codename: "operator-b", label: "Beta" },
  { codename: "operator-c", label: "Gamma" },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function openPicker() {
  const onSelect = vi.fn();
  render(<OperatorSearchSelect options={options} selectedCode="operator-a"
    disabledCode="operator-b" sideLabel="Operator A" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole("button", { name: "Change Operator A: Alpha" }));
  return { onSelect, input: screen.getByRole("textbox", { name: "Search Operator A" }) };
}

describe("operator picker interaction states", () => {
  it("exposes the active keyboard row and selects it with Enter", () => {
    const { input, onSelect } = openPicker();
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("data-highlighted", "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Gamma" })).toHaveAttribute("data-highlighted", "true");
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("data-highlighted", "false");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("operator-c");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cannot select the opposing operator using Enter", () => {
    const { input, onSelect } = openPicker();
    fireEvent.change(input, { target: { value: "beta" } });
    expect(screen.getByRole("button", { name: "Beta" })).toBeDisabled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toBeInTheDocument();
  });

  it("filters by code, handles empty results, and clears search after Escape", () => {
    const { input, onSelect } = openPicker();
    fireEvent.change(input, { target: { value: "operator-c" } });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "no-such-operator" } });
    expect(screen.getByText("No operators found")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Change Operator A: Alpha" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument();
  });
});
