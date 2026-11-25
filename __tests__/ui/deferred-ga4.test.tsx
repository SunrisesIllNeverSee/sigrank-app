import { describe, it, expect, beforeEach } from "vitest";
import { loadGA4OnFirstInteraction } from "@/components/analytics/DeferredGA4";

const gtagScripts = () => document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');

describe("DeferredGA4", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete (window as unknown as { dataLayer?: unknown }).dataLayer;
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("does not load gtag on page load", () => {
    const cleanup = loadGA4OnFirstInteraction();
    expect(gtagScripts().length).toBe(0);
    expect((window as unknown as { dataLayer?: unknown }).dataLayer).toBeUndefined();
    cleanup();
  });

  it.each(["pointerdown", "keydown", "scroll", "touchstart"])("loads gtag once after %s", (type) => {
    loadGA4OnFirstInteraction();
    window.dispatchEvent(new Event(type));
    window.dispatchEvent(new Event(type));
    document.dispatchEvent(new Event(type));
    expect(gtagScripts().length).toBe(1);
    const dl = (window as unknown as { dataLayer: unknown[] }).dataLayer;
    expect(dl.length).toBe(2); // js + config
    expect(Array.from(dl[1] as ArrayLike<unknown>)).toEqual(["config", "G-YQCKR06LBH"]);
  });

  it("does not load after cleanup (unmount before interaction)", () => {
    const cleanup = loadGA4OnFirstInteraction();
    cleanup();
    window.dispatchEvent(new Event("pointerdown"));
    expect(gtagScripts().length).toBe(0);
  });
});
