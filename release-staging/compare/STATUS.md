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

## 2026-10-12 — Live-only Compare + full-width Token Longevity
- Both Compare operands must be live, active, claimed, scored all-time operator-total rows, drawn from the canonical 22-member live board. Seeded/unclaimed/UR profiles and synthetic `the-field` are not eligible, even via direct URL. Signed-in comparison shortcut is offered only to an eligible ranked operator.
- The bottom Token Longevity module now spans the entire stage width below both the operator reports and the stage-right vertical statistics ledger. The ledger no longer reaches behind or alongside the chart.
- Token Longevity displays measured dated I+O+W+R snapshot totals; same-day repeated window/platform observations use the maximum record rather than adding overlapping records. It is NOT cumulative lifetime volume. Single observations are points; no interpolation or fabricated series.
- Production-style isolated build: PASS. 1440px stage/chart width 986px; 960px stage/chart width 845px, exact equality in both. 22/22 live selector entries, no Field or seeded entries, forged selection URLs repaired. Two observed time series in sample (four dated points each). Zero React page exceptions after fixing nested SVG tooltip markup.
- This is a staged, Compare-only candidate. Safari owner visual signoff, overall staging promotion and production deployment remain separate gates.
