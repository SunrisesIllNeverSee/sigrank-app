/**
 * Builds a standalone leaderboard PNG surface from the CURRENT ranked page.
 *
 * The live table sits inside a two-axis scroll container and may append
 * registered-but-unranked members after the ranked cohort. Capturing that
 * container clips offscreen columns/rows and adds the entire UR population.
 *
 * Clone only the table instead: the visible React tree, pagination, sort,
 * filter state, and UR membership are never changed by a screenshot.
 */
export const MAX_RANKED_CAPTURE_ROWS = 25;

export function cloneRankedBoardTable(container: HTMLElement): HTMLTableElement {
  const original = container.querySelector<HTMLTableElement>("table.board-t");
  if (!original) throw new Error("Leaderboard table is not available for capture");

  const table = original.cloneNode(true) as HTMLTableElement;
  const body = table.tBodies.item(0);
  if (!body) throw new Error("Leaderboard table has no ranked rows");

  // UR members are not part of ranked pagination or ranking calculations.
  body.querySelectorAll("tr.unranked-member, tr.board-empty").forEach((row) => row.remove());
  const ranked = Array.from(body.rows);
  if (!ranked.length) throw new Error("No ranked operators on this page");

  ranked.slice(MAX_RANKED_CAPTURE_ROWS).forEach((row) => row.remove());

  // The live table has sticky columns and a sticky two-line header. In an
  // image export everything must sit in its normal, non-scrolling position.
  table.querySelectorAll<HTMLElement>("th, td").forEach((cell) => {
    cell.style.setProperty("position", "static", "important");
    cell.style.setProperty("left", "auto", "important");
    cell.style.setProperty("top", "auto", "important");
    cell.style.setProperty("z-index", "auto", "important");
  });
  table.style.setProperty("max-width", "none", "important");
  return table;
}

export interface RankedBoardCaptureSurface {
  surface: HTMLDivElement;
  width: number;
  height: number;
  rowCount: number;
  dispose: () => void;
}

export function mountRankedBoardCaptureSurface(
  container: HTMLElement,
  header: HTMLElement,
): RankedBoardCaptureSurface {
  const parent = container.parentElement;
  if (!parent) throw new Error("Leaderboard capture target is not mounted");

  const table = cloneRankedBoardTable(container);
  const rowCount = table.tBodies.item(0)?.rows.length ?? 0;

  // Mount under the existing themed stage so the export retains the live
  // theme/font CSS. Capture only `surface`, not the offscreen `host`.
  const host = document.createElement("div");
  host.setAttribute("data-board-capture-host", "");
  host.style.cssText =
    "position:fixed;left:-100000px;top:0;pointer-events:none;z-index:-1;overflow:visible;";

  const surface = document.createElement("div");
  surface.setAttribute("data-ranked-board-export", "");
  surface.style.cssText =
    "display:flex;flex-direction:column;box-sizing:border-box;overflow:visible;background:#080e08;border:1px solid var(--line);";

  surface.append(header, table);
  host.appendChild(surface);
  parent.appendChild(host);

  // Measure intrinsic table width, *not* the scroll viewport's clientWidth.
  // Explicit dimensions also prevent html-to-image from silently cropping
  // cells beyond the horizontal scrollbar or the last row.
  const width = Math.ceil(
    Math.max(table.scrollWidth, table.getBoundingClientRect().width, container.scrollWidth, 1200),
  );
  surface.style.width = `${width}px`;
  table.style.width = `${width}px`;
  const fullWidth = Math.ceil(Math.max(width, surface.scrollWidth));
  if (fullWidth > width) {
    surface.style.width = `${fullWidth}px`;
    table.style.width = `${fullWidth}px`;
  }
  const height = Math.ceil(
    Math.max(surface.scrollHeight, surface.getBoundingClientRect().height),
  );
  return {
    surface,
    width: fullWidth,
    height,
    rowCount,
    dispose: () => host.remove(),
  };
}
