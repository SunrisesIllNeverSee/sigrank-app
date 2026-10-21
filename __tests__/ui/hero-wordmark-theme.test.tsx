import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WaveHeroTitle } from "@/components/ui/WaveHeroTitle";
import { TerminalWordmark } from "@/components/home/TerminalWordmark";

beforeEach(() => { document.documentElement.dataset.theme = "terminal"; });
afterEach(() => { cleanup(); delete document.documentElement.dataset.theme; });

describe("hero theme scope", () => {
  it.each(["green", "gold"])("uses pixels for the %s workspace", (theme) => {
    const { container } = render(<div className="lbw-root" data-theme={theme}>
      <WaveHeroTitle title="SignalAF Wiki" terminalText="WIKI" />
    </div>);
    expect(container.querySelectorAll(".tbt-row")).toHaveLength(5);
    expect(screen.getByRole("heading", { name: "SignalAF Wiki" })).toHaveClass("sr-only");
  });

  it.each(["bone", "purple"])("uses theme typography for %s even when html remains terminal", (theme) => {
    const { container } = render(<div className="lbw-root" data-theme={theme}>
      <WaveHeroTitle title="SignalAF Wiki" terminalText="WIKI" />
    </div>);
    expect(container.querySelector(".tbt-fit")).toBeNull();
    expect(screen.getByRole("heading")).toHaveClass("wave-hero-wordmark");
  });

  it("switches both the page title and SigRank mark with the local theme", async () => {
    const { container } = render(<div className="lbw-root" data-theme="gold">
      <WaveHeroTitle title="SignalAF Wiki" terminalText="WIKI" />
      <TerminalWordmark />
    </div>);
    const root = container.querySelector(".lbw-root")!;
    expect(container.querySelectorAll(".tbt-fit")).toHaveLength(2);
    await act(async () => { root.setAttribute("data-theme", "bone"); });
    await waitFor(() => expect(screen.getByRole("heading")).not.toHaveClass("sr-only"));
    expect(container.querySelector('[aria-label="SIGRANK"]')).not.toBeVisible();
    await act(async () => { root.setAttribute("data-theme", "green"); });
    await waitFor(() => expect(screen.getByRole("heading")).toHaveClass("sr-only"));
    expect(container.querySelector('[aria-label="SIGRANK"]')).toBeVisible();
  });

  it("uses the document theme for heroes outside a workspace", async () => {
    document.documentElement.dataset.theme = "carbon";
    const { container } = render(<WaveHeroTitle title="Wiki" terminalText="WIKI" />);
    expect(container.querySelector(".tbt-fit")).not.toBeNull();
    await act(async () => { document.documentElement.dataset.theme = "paper"; });
    await waitFor(() => expect(container.querySelector(".tbt-fit")).toBeNull());
  });
});
