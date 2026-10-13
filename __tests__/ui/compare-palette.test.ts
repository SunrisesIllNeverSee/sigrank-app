import { describe, expect, it } from "vitest";
import { compareClassPalette } from "@/components/compare/compare-palette";

describe("Compare class color parity with browser-safe fallbacks", () => {
  it.each([
    ["TRANSMITTER", "class-transmitter", "245,166,35"],
    ["ARCH+ I", "class-archplus", "96,165,250"],
    ["ARCH IV", "class-arch", "59,130,246"],
    ["POWER III", "class-power", "167,139,250"],
    ["BASE III", "class-base", "148,163,184"],
    ["SEEKER I", "class-seeker", "45,212,160"],
    ["REFINER I", "class-refiner", "244,116,72"],
    ["BEARER II", "class-bearer", "129,140,248"],
    ["IGNITER I", "class-igniter", "100,116,139"],
  ])("%s maps to original class token and explicit rgba fallback",
    (tier, token, rgb) => {
      const p = compareClassPalette(tier);
      expect(p.token).toBe(token);
      expect(p.color).toContain("--" + token);
      expect(p.tint(0.16)).toBe("rgba(" + rgb + ",0.16)");
    });

  it("falls back to BASE for missing class without emitting invalid CSS", () => {
    expect(compareClassPalette(null).token).toBe("class-base");
    expect(compareClassPalette("unknown label").color).toContain("class-base");
  });
});
