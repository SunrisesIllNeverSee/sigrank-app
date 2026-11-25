import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
    expect((window as unknown as { dataLayer: unknown[] }).dataLayer).toEqual([]); // stub only, no config
    cleanup();
  });

  // jsdom's isTrusted is unforgeable, so capture the registered handlers and call
  // them with a stand-in event to simulate a real (trusted) user interaction.
  let handlers: Record<string, (e: Event) => void> = {};
  beforeEach(() => {
    handlers = {};
    const orig = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((type: string, h: unknown, o?: unknown) => {
      handlers[type] = h as (e: Event) => void;
      orig(type, h as EventListener, o as AddEventListenerOptions);
    });
  });
  afterEach(() => vi.restoreAllMocks());
  const trusted = (type: string) => ({ type, isTrusted: true }) as unknown as Event;
  const fire = (type: string) => handlers[type]?.(trusted(type));

  it.each(["pointerdown", "keydown", "touchstart"])("loads gtag once after trusted %s", (type) => {
    loadGA4OnFirstInteraction();
    fire(type);
    fire(type);
    expect(gtagScripts().length).toBe(1);
    const dl = (window as unknown as { dataLayer: unknown[] }).dataLayer;
    expect(dl.length).toBe(2); // js + config
    expect(Array.from(dl[1] as ArrayLike<unknown>)).toEqual(["config", "G-YQCKR06LBH"]);
  });

  it("ignores scroll and synthetic (untrusted) events", () => {
    loadGA4OnFirstInteraction();
    expect(handlers["scroll"]).toBeUndefined();
    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("keydown"));
    expect(gtagScripts().length).toBe(0);
  });

  it("installs the queueing stub immediately so early gtag calls are buffered", () => {
    loadGA4OnFirstInteraction();
    const w = window as unknown as { gtag: (...a: unknown[]) => void; dataLayer: unknown[] };
    expect(typeof w.gtag).toBe("function");
    w.gtag("event", "early");
    expect(w.dataLayer.length).toBe(1);
    expect(gtagScripts().length).toBe(0);
    fire("keydown");
    expect(w.dataLayer.length).toBe(3); // early + js + config
    expect(gtagScripts().length).toBe(1);
  });

  it("does not load after cleanup (unmount before interaction)", () => {
    const cleanup = loadGA4OnFirstInteraction();
    cleanup();
    window.dispatchEvent(new Event("pointerdown"));
    expect(gtagScripts().length).toBe(0);
  });
});
