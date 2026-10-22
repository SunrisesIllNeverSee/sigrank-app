import { test, expect } from "@playwright/test";

for (const theme of ["gold", "green", "bone", "purple"]) {
  for (const width of [1440, 390]) {
    test(`${theme} compare controls and hierarchy at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`/compare?theme=${theme}`);
      await expect(page.locator(".lbw-root")).toHaveAttribute("data-theme", theme);
      const stage = page.locator(".ws-cmp-stage");
      await expect(stage).toBeVisible();
      const ledger = stage.locator(".cmp-ledger-workspace");
      const baseline = await ledger.innerText();
      const geometry = await stage.evaluate(el => {
        const bounds = el.getBoundingClientRect();
        return {
          fits: [...el.querySelectorAll(".cmp-matchup-panel,.ws-cmp-ledger,.cmp-h2h,.cmp-operator-picker")].every(child => {
            const rect = child.getBoundingClientRect();
            if (child.matches(".cmp-h2h")) return rect.left >= 0 && rect.right <= innerWidth;
            return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
          }),
          documentFits: document.documentElement.scrollWidth <= innerWidth,
          headerBorder: getComputedStyle(el.querySelector(".cmp-stage-head")!).borderTopWidth,
        };
      });
      expect(geometry).toEqual({ fits: true, documentFits: true, headerBorder: "0px" });
      const leading = stage.locator(".cmp-profile-leading");
      if (await leading.count()) {
        const colors = await leading.evaluate(el => ({
          badge: getComputedStyle(el).color,
          operator: getComputedStyle(el.closest(".cmp-profile-header")!.querySelector(".cmp-profile-rank b")!).color,
        }));
        expect(colors.badge).toBe(colors.operator);
      }

      for (const side of ["a", "b"]) {
        const picker = stage.locator(`.cmp-operator-picker--${side}`);
        const trigger = picker.locator(".cmp-operator-trigger");
        const before = await trigger.boundingBox();
        if (width === 390) expect(before!.height).toBeGreaterThanOrEqual(44);
        await trigger.click();
        const input = picker.getByRole("textbox");
        await expect(input).toBeFocused();
        const menu = picker.locator(".cmp-operator-menu");
        const options = menu.locator("button");
        const enabledIndex = await options.evaluateAll(es => es.findIndex(e => !(e as HTMLButtonElement).disabled));
        for (let i = 0; i < enabledIndex; i++) await input.press("ArrowDown");
        const active = menu.locator('[data-highlighted="true"]:not(:disabled)');
        await expect(active).toHaveCount(1);
        await expect(active).toHaveCSS("box-shadow", /inset/);
        const ink = await picker.locator(".cmp-operator-picker-label").evaluate(el => getComputedStyle(el).color);
        await expect(active).toHaveCSS("color", ink);
        const previous = options.nth(enabledIndex);
        await previous.hover();
        const nextIndex = await options.evaluateAll((es, start) => es.findIndex((e, i) => i > start && !(e as HTMLButtonElement).disabled), enabledIndex);
        expect(nextIndex).toBeGreaterThan(enabledIndex);
        for (let i = enabledIndex; i < nextIndex; i++) await input.press("ArrowDown");
        await expect(previous).toHaveAttribute("data-highlighted", "false");
        await expect(previous).toHaveCSS("box-shadow", "none");
        await expect(active).toHaveCSS("box-shadow", /inset/);
        if (width === 390) {
          expect((await active.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          await expect(input).toHaveCSS("font-size", "16px");
        }
        const target = await active.innerText();
        await input.fill("no-match-operator-zzzzzz");
        await expect(menu).toHaveText("No operators found");
        await input.fill(target);
        await expect(menu.getByRole("button", { name: target, exact: true })).toBeEnabled();
        await input.press("Escape");
        await expect(trigger).toBeVisible();
      }
      expect(await ledger.innerText()).toBe(baseline);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(stage.locator(".cmp-operator-trigger").first()).toHaveCSS("transition-duration", "0s");

      if (width === 390) {
        const names = await stage.locator(".cmp-profile-name").allTextContents();
        await stage.getByRole("button", { name: "Swap operators A and B" }).click();
        await expect(stage.locator(".cmp-profile-name")).toHaveText([...names].reverse());
      } else {
        const picker = stage.locator(".cmp-operator-picker--b");
        const current = await picker.locator(".cmp-operator-selected").innerText();
        await picker.locator(".cmp-operator-trigger").click();
        const choices = await picker.locator(".cmp-operator-menu button:enabled").allTextContents();
        const target = choices.find(name => name !== current)!;
        expect(target).toBeTruthy();
        await picker.getByRole("textbox").fill(target);
        await picker.getByRole("textbox").press("Enter");
        await expect(stage.locator('.cmp-profile-header[data-operator-side="b"] .cmp-profile-name')).toHaveText(target);
      }
    });
  }
}
