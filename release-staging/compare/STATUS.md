# Compare — roughed

Route /compare. Main implementation app/compare/page.tsx, components/compare/.
A reviewed layout evidence copy: compare-layout.json.
- [x] Route HTTP 200 locally.
- [x] Existing approved-layout JSON located in scratch editor.
- [ ] Owner final spacing/graphics: operator matchup, radar pair, metric ledger and share card.
- [ ] Validate selectors/query URLs, metrics and raw comparisons, empty data, auth-gated controls.
- [ ] Responsive/keyboard accessibility, canonical tests and owner release signoff.
RELEASE READY NO. DEPLOYED NO.

## 2026-10-12 · Operator-led stage / Safari palette review candidate
- Compare section only: stage is two columns, each operator matchup report
  owns its RAW + cascade metric radar underneath; the full metric ledger is
  vertical in the stage-right column. Overtime remains under the reports.
- Class hues come from actual SigRank operator class (and explicit rgba
  fallback); previous hardcoded A=blue / B=teal is retired in Compare.
- Preserved existing normalization against both operators, canonical data
  values, selectors, history and share cards; no score write.
- Chromium browser regression verified at 1440 and 960; desktop Safari visual
  acceptance pending because automated WebKit executable is not installed.
- Build-only font workaround used solely in isolated test copy, not in stage.
- No deploy or production write; independent Compare-only commit.
