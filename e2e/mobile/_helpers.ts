/**
 * e2e/mobile/_helpers.ts — shared helpers for the phone specs (T0 foundation).
 * Other mobile tasks (board / profile / compare / other pages) import these.
 */
import { expect, type Page } from "@playwright/test";

/** Phone viewports the acceptance criteria are checked at. */
export const PHONE_SIZES = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

/** Workspace themes (localStorage 'lbw-theme'). */
export const THEMES = ["green", "gold", "bone", "purple"] as const;

/** Open a workspace page with a theme preset and wait for the mobile chrome. */
export async function gotoPhone(page: Page, path: string, theme: (typeof THEMES)[number] = "green") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("lbw-theme", t);
    } catch {
      /* ignore */
    }
  }, theme);
  await page.goto(path);
  await page.locator(".m-tabs").waitFor({ state: "visible" });
}

/**
 * "Content reachable", not just "document does not overflow": the shell clips,
 * so scrollWidth passes while content is offscreen. Checks the stage column's
 * right edge and the document width against the viewport.
 */
export async function expectNoHorizontalClip(page: Page) {
  const m = await page.evaluate(() => {
    const stage = document.querySelector(".stagecol");
    return {
      iw: window.innerWidth,
      doc: document.documentElement.scrollWidth,
      stageRight: stage ? Math.round(stage.getBoundingClientRect().right) : 0,
    };
  });
  expect(m.doc).toBeLessThanOrEqual(m.iw);
  expect(m.stageRight).toBeLessThanOrEqual(m.iw);
}

/** Collect console errors/warnings that are not third-party analytics noise. */
export function trackConsole(page: Page): string[] {
  const out: string[] = [];
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    const t = m.text();
    if (/google|gtag|collect\?|posthog|analytics|Content Security Policy|Failed to load resource|Download the React DevTools/i.test(t)) return;
    out.push(t);
  });
  return out;
}
