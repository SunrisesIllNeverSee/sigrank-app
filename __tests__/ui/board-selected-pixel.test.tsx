import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BoardRow } from "@/components/live/rows";
import { mapOperator, type DbOperator } from "@/lib/board/mappers";
import type { LiveOperator } from "@/lib/board/live-types";
import type { TopSets } from "@/components/live/utils";

const identity = { claimed: true, profile_visibility: "public", status: "active", profile_pixel_badge: "tokens10m" } as DbOperator;

describe("public board selected pixel", () => {
  it("carries the saved badge while redacting private, unclaimed and retired identities", () => {
    expect(mapOperator(identity).profile_pixel_badge).toBe("tokens10m");
    for (const patch of [{ profile_visibility: "private" }, { claimed: false }, { status: "retired" }]) {
      expect(mapOperator({ ...identity, ...patch }).profile_pixel_badge).toBeNull();
    }
  });
  it("renders the saved badge beside the name below the percentile award threshold", () => {
    const o = { name: "Example", codename: "example", handle: "@example", pixelBadge: "tokens10m", pct: 57, cost: "—", num: {}, snr: 0.5, vel: 1, dev: 1, scalev: 8 } as LiveOperator;
    const tt = Object.fromEntries(["tot", "day", "yield", "snr", "vel", "lev", "dev", "ratio", "eff", "cost"].map(k => [k, []])) as unknown as TopSets;
    const html = renderToStaticMarkup(<table><tbody><BoardRow o={o} i={0} r={10} viewMode="ops" colMode="metrics" tt={tt} rawRank={1} selected={false} onSelect={() => {}} /></tbody></table>);
    expect(html).toContain('aria-label="10M TOKENS MILESTONE"');
  });
});
