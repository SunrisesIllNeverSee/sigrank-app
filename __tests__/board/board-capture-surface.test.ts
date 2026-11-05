import { afterEach, describe, expect, it } from "vitest";
import {
  cloneRankedBoardTable,
  mountRankedBoardCaptureSurface,
  MAX_RANKED_CAPTURE_ROWS,
} from "@/lib/board/board-capture-surface";

const mounts: HTMLElement[] = [];
afterEach(() => mounts.splice(0).forEach((root) => root.remove()));

function board(ranked: number, unranked: number) {
  const stage = document.createElement("section");
  stage.className = "stage stage-board";
  const viewport = document.createElement("section");
  viewport.className = "tablecard";
  viewport.style.cssText = "width:400px;height:150px;overflow:auto";
  viewport.innerHTML = `
    <table class="board-t">
      <thead><tr><th class="pin">RANK</th><th>OPERATOR</th><th>∑TOTAL09</th></tr></thead>
      <tbody>
        ${Array.from({ length: ranked }, (_, i) => `<tr class="ranked"><td class="pin">${i + 1}</td><td>Ranked ${i + 1}</td><td>100</td></tr>`).join("")}
        ${Array.from({ length: unranked }, (_, i) => `<tr class="unranked-member"><td>UR</td><td>Unranked ${i + 1}</td><td>—</td></tr>`).join("")}
      </tbody>
    </table>`;
  stage.appendChild(viewport);
  document.body.appendChild(stage);
  mounts.push(stage);
  return viewport;
}

describe("ranked leaderboard PNG surface", () => {
  it("captures 22 ranked operators but none of 29 appended UR members", () => {
    const viewport = board(22, 29);
    const original = viewport.innerHTML;
    const cloned = cloneRankedBoardTable(viewport);
    expect(cloned.tBodies[0].rows).toHaveLength(22);
    expect(cloned.querySelectorAll("tr.unranked-member")).toHaveLength(0);
    expect(cloned.querySelectorAll("thead th")).toHaveLength(3);
    expect(viewport.innerHTML).toBe(original);
  });

  it("limits to the current ranked page of 25 without hiding columns", () => {
    const viewport = board(28, 12);
    const cloned = cloneRankedBoardTable(viewport);
    expect(MAX_RANKED_CAPTURE_ROWS).toBe(25);
    expect(cloned.tBodies[0].rows).toHaveLength(25);
    expect(cloned.tBodies[0].rows[24].textContent).toContain("Ranked 25");
    expect(cloned.querySelectorAll("thead th")).toHaveLength(3);
    expect(cloned.querySelector<HTMLElement>("thead th")?.style.position).toBe("static");
    expect(cloned.querySelector("tbody td")?.getAttribute("style")).toContain("position: static");
  });

  it("mounts an independent surface and disposes without changing the live table", () => {
    const viewport = board(3, 4);
    const originalTable = viewport.querySelector("table");
    const header = document.createElement("div");
    header.textContent = "SigRank — Leaderboard Snapshot";
    const capture = mountRankedBoardCaptureSurface(viewport, header);
    expect(capture.rowCount).toBe(3);
    expect(capture.width).toBeGreaterThanOrEqual(1200);
    expect(capture.surface.contains(originalTable)).toBe(false);
    expect(viewport.querySelector("table")).toBe(originalTable);
    expect(capture.surface.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(capture.surface.querySelectorAll("tr.unranked-member")).toHaveLength(0);
    expect(capture.surface.textContent).toContain("Leaderboard Snapshot");
    capture.dispose();
    expect(document.querySelector("[data-board-capture-host]")).toBeNull();
    expect(viewport.querySelectorAll("tbody tr")).toHaveLength(7);
  });

  it("refuses an export with no ranked operators", () => {
    expect(() => cloneRankedBoardTable(board(0, 5))).toThrow("No ranked operators");
  });
});
