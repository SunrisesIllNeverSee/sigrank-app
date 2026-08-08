import { describe, it, expect } from "vitest";

import { PLATFORMS } from "@/lib/identity/canon-ids";

/**
 * PLATFORMS (CANON T.15) — canonical IDs are APPEND-ONLY.
 *
 * P.01–P.07 are published identifiers; renumbering one silently repoints every
 * historical reference. oh-my-pi is therefore P.08, appended after Codex, and
 * P.04 must remain the older pi-agent.
 */
describe("PLATFORMS canon ids", () => {
  it("pins every pre-existing id to its domain (no renumbering)", () => {
    const domains = Object.fromEntries(
      Object.entries(PLATFORMS).map(([id, def]) => [id, def.domain]),
    );
    expect(domains).toEqual({
      "P.01": "claude",
      "P.02": "chatgpt",
      "P.03": "gemini",
      "P.04": "pi",
      "P.05": "multi",
      "P.06": "other",
      "P.07": "codex",
      "P.08": "omp",
    });
  });

  it("registers P.08 as Oh My Pi with its own brand color", () => {
    const omp = PLATFORMS["P.08"];
    expect(omp).toBeDefined();
    expect(omp.id).toBe("P.08");
    expect(omp.label).toBe("Oh My Pi");
    expect(omp.hex).toBeTruthy();
  });

  it("gives P.08 a color distinct from every other platform", () => {
    const hexes = Object.values(PLATFORMS)
      .map((p) => p.hex)
      .filter((h): h is string => Boolean(h));
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});
