# Owner edit checklist — October 12, 2026

Status: recorded requests; implementation and verification remain open unless explicitly marked complete. Work in the staged integration tree on `integration/site-a315435`; preview `http://localhost:3230`. Do not substitute the :8791 design mock for the staged application. Production remains unchanged during redesign.

## Leaderboard

- [x] **Add Scale V to the leaderboard.** Show a readable definition/tooltip: `log10(input + output + cache-write + cache-read)`; each +1 is 10× total recorded token activity. Distinguish activity volume, reused context, efficiency, and unique content. Preserve the existing formula and keep raw Total Tokens available. Check sort, formatting and export behavior.
  - Verified 2026-10-12: sort descending, 14 metrics columns, 22 visible Scale V values, CSV compact and exact totals, Wiki /wiki/metrics/scale-v; receipt in OWNER_EDIT_RESULTS.md.
- [ ] **Later exploration: “needle in a haystack.”** Investigate whether scale can contextualize meaningful signal amid a large volume of context. Define the question and required evidence before claiming that Scale V measures signal discovery, meaningful content, or retrieval success. Those are not measured by the current formula. Owner will explore the more interesting presentation later.
- [ ] **Signed-in operator dock.** On initial load, the leaderboard OPERATOR PROFILE should show the authenticated user's linked operator, using the saved identity/badge and current data. Specify how a deliberate row selection temporarily changes the dock and how to return to “My profile”; verify loading, signed-out, and missing-operator states without impersonating a user.
- [ ] **Recover the earlier rich OPERATOR PROFILE presentation.** Locate its source/history before rebuilding. Restore or reconcile the identity header, rank + percentile, class/archetype, dual-signature radar, per-column ranks (Yield/SNR/Velocity/Leverage/10xDEV), signal sparkline + observation count, record highlights, and See Profile / Compare / Watch actions. Preserve expand/collapse/close controls where useful. Check every value and action against live data.

### Earlier dock reference supplied by owner

The reference showed M§ / MO§ES™, `signal-92b4f9f485`, #1 / 99.8%ile, POWER II / TRANSMITTER, dual-signature radar, column ranks, SIGNAL · 8 OBS, and record highlights for highest Yield, most cache-read and highest leverage.

**These figures are historical design references, not accepted current data.** Do not hard-code its #1 ranks, 96.4 Yield, 0.900 SNR, 9.03 Velocity, 2,042× Leverage, 3.31 DEV, or 2.56B cache-read into the current dock.

## Compare

- [x] **Devin: inspect and repair action wiring.** Inventory every rendered instance of Throw-Downs / Coming soon / Challenge on X; Share matchup; Preview; Download card; and Download matchup card. Determine whether duplicates are intentionally distinct outputs or redundant controls. Record component ownership and actual destinations. *(Verified: CompareShareCard produces 1200×630 landscape card `sigrank-compare-<a-vs-b>.png`; CompareMatchupCard produces 1200×900 social card `sigrank-matchup-<a-vs-b>.png`. Both intentionally distinct artifacts.)*
- [x] Verify Challenge on X uses the currently selected operators and correct public comparison URL; confirm encoding and blank/invalid operator behavior. Keep Throw-Downs explicitly coming soon until an actual challenge workflow exists. Do not publish a test post. *(Repaired: cleans leading @, falls back to display name or operator handle; compareUrl accurately passes ?a=&b=; Throw-Downs explicitly marked "Coming soon".)*
- [x] Verify Share matchup shares/copies the correct selected matchup; Preview shows the matching artifact; each download produces the intended card with correct names, colors, numbers and filename. Check cancellation, failures and unavailable browser sharing. Respect operator visibility and privacy. *(Repaired: operand colors aligned with COMPARE_OPERAND_COLORS; clipboard copy with prompt fallback; download filenames customized to operands; Preview matches download.)*
- [ ] **Later design: consolidated Share button.** Explore placing export/share/preview/download and challenge actions in one menu, with clear labels for distinct artifacts and no duplicated actions. Owner will review this alongside chart ideas; do not assume a final menu design yet.
- [ ] **Later design: chart alternatives and placement.** Owner will explore layouts elsewhere. Carry forward the goal: clearly show how the two operators plot differently, including possible sparklines. Preserve current data; label normalization/scale honestly. Do not treat the previously suggested logarithmic radars or paired sparklines as owner-approved implementation.

Already completed separately: distinct A/B comparison colors, while retaining class badge colors (`263a6de`). This does not complete chart scaling or the action audit.

## User profile

- [ ] **Move submission activity into the right sidebar.** Identify the precise current module, preserve detail/empty states and links, and fit it within the shell without forcing the whole page to scroll.
- [ ] **Move Records & Honors into the right sidebar as well.** Reconcile its placement with submission activity and the existing sidebar modules; retain access to full record details.
- [ ] **Improve record graphics.** Use larger, clearer trophies/record symbols with readable labels and consistent treatment. Keep earned, pending and unavailable records visually distinct.
- [ ] **Explore clickable record popovers/dialogs.** A record can open its metric definition, value, scope, date/window, rank and supporting submission where available. Only show supported facts. Verify keyboard focus, Escape/outside dismissal and return focus. Owner suggested this interaction; final design remains to be reviewed.
- [ ] **Restore holographic card shine.** Locate the earlier animation and diagnose why it stopped rendering. Restore the effect in the staged profile, including Safari behavior and reduced-motion support. Do not replace the whole card blindly.
- [ ] **Create workflow symbols.** Design distinguishable symbols for OITL and Automated / operator-agent / agentic. Resolve final naming with owner; pair symbols with accessible text. Keep unresolved workflow evidence distinct from verified automation.
- [ ] **Show both ranking contexts on the cards.** Display Hybrid / combined-field rank and the narrower applicable workflow rank, each labeled with cohort and window. Derive them from the corresponding live cohorts; never relabel global rank as workflow rank. Use an honest unranked/pending state where appropriate. Hybrid remains the combined field; unranked operators may remain included according to the existing board contract.
- [ ] **Compact ticker stat boxes.** Reduce excess padding/height and empty space while keeping values, labels and field comparisons legible. Verify large values, narrow viewports and Safari; do not clip ticker content.

## Completion / handoff checklist

- [ ] Each implementation has a scoped commit and a short verification receipt.
- [ ] Verify actual staged routes in the browser, including the owner's signed-in profile where needed; mocks alone do not satisfy acceptance.
- [ ] Keep source data, workflow evidence, formulas and privacy rules intact.
- [ ] Update this checklist and the status board with evidence; leave unresolved design exploration open.
- [ ] Push completed staging work without bundling concurrent agents' files; do not merge/promote to production as part of these edits.
