import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardBriefings } from "@/components/live/BoardBriefings";

let reducedMotion = false;
beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value: function (this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value: function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

const mount = () => render(<BoardBriefings ops={[]} stats={[{ field: "median_yield", value: "12.5" }]} />);
const tick = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(6000); }); };

describe("leaderboard briefings", () => {
  it("rotates between both views and pauses while the reader hovers", async () => {
    mount();
    expect(screen.getByRole("button", { name: "Open Signal Wire" })).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(1);
    await tick();
    const preview = screen.getByRole("button", { name: "Open Field Notes" });
    fireEvent.mouseEnter(preview.closest(".board-briefings")!);
    await tick();
    expect(screen.getByRole("button", { name: "Open Field Notes" })).toBeInTheDocument();
    fireEvent.mouseLeave(preview.closest(".board-briefings")!);
    await tick();
    expect(screen.getByRole("button", { name: "Open Signal Wire" })).toBeInTheDocument();
  });

  it("freezes the chosen view in the popup and resumes after closing", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Field Notes" }));
    expect(screen.getByRole("dialog", { name: "Wire / Notes" })).toBeInTheDocument();
    await tick();
    expect(screen.getByRole("region", { name: "Field Notes" })).toHaveTextContent("12.5");
    fireEvent.click(screen.getByRole("button", { name: "Close Wire / Notes" }));
    await tick();
    expect(screen.getByRole("button", { name: "Open Signal Wire" })).toBeInTheDocument();
  });

  it("respects reduced motion while keeping both views accessible", async () => {
    reducedMotion = true;
    mount();
    await tick();
    expect(screen.getByRole("button", { name: "Open Signal Wire" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Field Notes" }));
    expect(screen.getByRole("region", { name: "Field Notes" })).toHaveTextContent("12.5");
  });
});
