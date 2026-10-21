# components/mobile — phone chrome (owner 2026-10-21)

Foundation for the phone layout (<= 760px). Everything here is `display:none`
above 760px, so desktop (> 1050px) and tablet (761-1050px) are untouched by it.
SSR markup is the same for every viewport; JS only owns which overlay is open.

## Breakpoints

| Range | Behavior |
|---|---|
| > 1050px | Desktop, unchanged. |
| 761-1050px | Tablet. Both sidebars start **collapsed**, the stage is full width, no horizontal pan. The sidebars open as overlay drawers over the stage (PANEL tab / rail toggle), with a scrim; Esc or scrim closes. |
| <= 760px | Phone. Icon rail, bottom ticker (`.ftr`), edge HIDE tabs and PANEL reopen tabs are hidden. Top bar + 4-tab bottom bar appear. The in-grid `.lside` / `.railcol` are never shown. |

Panels collapse after mount at <= 1050px (`WorkspaceShell` effect); until then
`.app[data-phone-init]` hides them via CSS, so there is no flash. `.lbw-root`
uses `100dvh`; `viewport-fit=cover` is set in `app/layout.tsx` so the chrome can
pad with `env(safe-area-inset-*)`.

## Components

- `MobileChrome` — the frame. Props: `active` (nav key, e.g. `"board"`), `theme`,
  `setTheme`, `iconSet`, `setIconSet` (same state the shell already has),
  optional `left` / `leftTitle` (sidebar modules, shown under the nav in the
  menu drawer), `right` / `rightTitle` (inspector modules, shown in a Details
  sheet opened from a top-bar button; the button only exists when `right` is
  set), `rightOpenSignal` (bump to open the Details sheet), and `children`
  (the page's `.app` element).
  Renders: top bar (menu, SIGNALAF wordmark, details, theme, account) ->
  `children` -> bottom tab bar, plus Drawer / Sheet / SearchOverlay when open.
  `left` / `right` are mounted only while their overlay is open.
- `BottomTabBar` — `<nav aria-label="Primary">`: Board, Compare, Profile, Search.
  `aria-current="page"` on the active tab. Profile -> `/user/<codename>` when
  signed in, otherwise `/me` (which routes to sign-in / claim). Search opens the overlay.
- `Drawer` (`open`, `onClose`, `label`, `side`) and `Sheet` (`open`, `onClose`,
  `label`, `full`) — modal dialogs, mounted only while open, focus-trapped, Esc / Back /
  scrim close, focus restored to the opener. Reusable by other tasks (badge
  popovers, filter sheet, ...).
- `SearchOverlay` — full-screen search reusing `components/live/GlobalSearch`'s index
  (`loadIndex`) and matchers; 16px input.
- `MenuNav` — nav groups in the menu drawer (Hall, SigRank, Field, Articles, Blog,
  Wiki, Methodology, Settings).
- `useDialog(open, onClose, ref)` — the shared modal behavior. Pushes one history
  entry so the Back button closes the dialog; a link tapped inside a dialog first
  unwinds that entry, then navigates (no duplicate history entry).

## Mounting (how LiveBoardWorkspace should use it)

`WorkspaceShell` already does this. For the board (`LiveBoardWorkspace`), wrap its
`.app` div the same way and pass the board's own theme / icon-set state:

```tsx
<MobileChrome active="board" theme={theme} setTheme={setTheme}
  iconSet={iconSet} setIconSet={setIconSet}
  left={leftModules} leftTitle="BOARD" right={inspectorModules} rightTitle="OPERATOR">
  <div className="app ...">...</div>
</MobileChrome>
```

The board must also render the shell classes the CSS keys on: `.app`, `.srail`,
`.maincol`, `.mid`, `.stagecol`, `.stitle`, `.lside`, `.railcol`, `.ftr`.

## CSS hooks

- `.m-top`, `.m-tabs`, `.m-tab(.on)`, `.m-ibtn`, `.m-wordmark` — chrome (mobile-chrome.css).
- `.m-layer` > `.m-dim` + `.m-drawer` / `.m-sheet` (`.m-sheet-full`); `.m-search` — overlays, z-index 300+.
- `.m-tscrim` — tablet scrim inside `.mid` (shown only 761-1050px).
- `.m-inline` — wrapper that strips pinned-column chrome from reused `.lside` / `.railcol` modules.
- Safe-area insets are applied in the chrome; pages should not add their own.
- Pages needing the phone/tablet split in their own CSS should use `@media (max-width:760px)` / `(min-width:761px) and (max-width:1050px)`.

## Notes / known gaps

- `.m-top` and `.m-tabs` are siblings of `.app` inside `.lbw-root` (a flex column), so
  the stage already fits between them; no extra padding is needed on the stage.
- The inline site search in `.stitle` is hidden on phones (the Search tab replaces it).
- Compare keeps its own 920px-wide pan layout until the compare task lands.
- Tests: `e2e/mobile/shell.spec.ts` (projects `mobile-webkit` = iPhone 13, `mobile-chromium` = Pixel 7);
  helpers in `e2e/mobile/_helpers.ts`. Run: `E2E_BASE_URL=http://localhost:3000 npx playwright test --project=mobile-chromium`.
