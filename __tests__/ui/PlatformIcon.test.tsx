import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { PlatformIcon, platformKey } from "@/components/sigrank/PlatformIcon";

/**
 * PlatformIcon — oh-my-pi (`omp`) is a known key with its own glyph, not the
 * 'other' fallback and not the older pi-agent (`pi`) mark.
 */
describe("platformKey", () => {
  it("recognizes 'omp' instead of bucketing it into 'other'", () => {
    expect(platformKey("omp")).toBe("omp");
    expect(platformKey("OMP")).toBe("omp");
  });

  it("still buckets an unknown platform into 'other'", () => {
    expect(platformKey("oh-my-pi")).toBe("other");
  });

  it("leaves 'pi' (pi-agent) alone", () => {
    expect(platformKey("pi")).toBe("pi");
  });
});

describe("PlatformIcon", () => {
  it("labels the omp glyph 'Oh My Pi'", () => {
    const { container } = render(<PlatformIcon platform="omp" />);
    expect(container.querySelector("title")?.textContent).toBe("Oh My Pi");
  });

  it("draws a glyph distinct from pi's", () => {
    const omp = render(<PlatformIcon platform="omp" />).container.innerHTML;
    const pi = render(<PlatformIcon platform="pi" />).container.innerHTML;
    const other = render(<PlatformIcon platform="other" />).container
      .innerHTML;
    expect(omp).not.toBe(pi);
    expect(omp).not.toBe(other);
  });
});
