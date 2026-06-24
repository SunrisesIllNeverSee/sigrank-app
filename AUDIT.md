# SigRank App — Code Audit

This document is the hand-off for a fresh session to remediate. It contains **30 adversarially-confirmed findings** grouped by severity (P1 → P2 → P3), then by dimension. Each finding lists the file, a title, the detail, and the suggested fix. Findings are numbered sequentially 1–30.

**Severity counts:** **7 × P1**, **16 × P2**, **7 × P3** (total 30).
**Per-dimension totals (all tiers):** correctness/bugs 4, security 6, canon accuracy 2, theme consistency 6, accessibility 5, dead code 7.

| Tier | correctness/bugs | security | canon accuracy | theme consistency | accessibility | dead code | Total |
|------|------------------|----------|----------------|-------------------|---------------|-----------|-------|
| P1   | 2 | 2 | 0 | 1 | 2 | 0 | **7** |
| P2   | 1 | 3 | 1 | 4 | 3 | 4 | **16** |
| P3   | 1 | 1 | 1 | 1 | 0 | 3 | **7** |

---

## P1 — Critical (7 findings)

### Dimension: correctness/bugs (2)

#### 1. Inverted percentile bar calculation uses wrong variable
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/operators/[codename]/page.tsx` (line 166)
- **Detail:** The progress bar width is set to `Math.min(100, row.percentile)%`, but line 112 correctly computes `topPct = Math.max(0, 100 - row.percentile)` to invert the percentile range, and line 161 already displays that inverted value in the text label (`Top {topPct.toFixed(2)}%`). The bar should use `topPct`, not `row.percentile`. With percentile in `[0,100]` where higher is better, a user at the 99.97th percentile (top 0.03%) shows the correct "Top 0.03%" label but the bar renders at 99.97% width — a semantic inconsistency between the bar and its label.
- **Fix:** Change line 166 from `style={{ width: `${Math.min(100, row.percentile)}%` }}` to `style={{ width: `${topPct}%` }}`.

#### 2. Platform filter parameter matching fails due to case mismatch
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/operators/page.tsx` (lines 52–55)
- **Detail:** `resolvePlatform()` performs a case-sensitive comparison (`p === raw`) where `p` is from `PLATFORM_UI` `['All', 'Claude', 'ChatGPT', 'Gemini', 'Pi', 'Multi']` (capitalized), but the query parameter from `app/page.tsx` line 79 sends lowercase via `p.toLowerCase()`. The `find()` never matches `'claude'` against `'Claude'`, so it always returns `PLATFORM_DEFAULT` (`'All'`). Platform filtering via `?platform=claude` is silently ignored.
- **Fix:** Change line 53 from `const match = PLATFORM_UI.find((p) => p === raw)` to `const match = PLATFORM_UI.find((p) => p.toLowerCase() === raw?.toLowerCase())`.

### Dimension: security (2)

#### 3. Unvalidated `contact` field stored without length limits
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/claim/route.ts` (line 50)
- **Detail:** The `contact` field is accepted from user input, typecast as string, and passed directly to Stripe metadata and the database without validation — no maximum length check and no format validation. Stripe metadata has a 500-char per-key limit that can be exceeded, causing the Stripe API call to fail. Confirmed in `route.ts` line 50 and `handlers.ts` lines 171–191.
- **Fix:** Add validation, e.g. `const contact = body.contact ? String(body.contact).slice(0, 100) : '';` or use a dedicated validation function. Consider rejecting if length exceeds a reasonable limit (e.g., 256 chars).

#### 4. Unvalidated `operator_id` used directly in database query (authorization bypass)
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/billing/portal/route.ts` (lines 56–57)
- **Detail:** The `operator_id` from the request body is passed directly to `customerForOperator()` without format validation, and the endpoint performs no authentication check to verify the caller owns that operator. The query runs with service-role credentials, which bypass Supabase RLS entirely, so an attacker can specify any `operator_id`, retrieve its Stripe customer ID, and then create billing-portal sessions to manage someone else's subscription. The "getSupabaseServer-guarded" comment is misleading — that function only selects DB credentials, it does not authorize.
- **Fix:** Add an authorization check binding the requested `operator_id` to the authenticated caller, and validate format before use: `if (body.operator_id && typeof body.operator_id === 'string' && /^[a-zA-Z0-9_-]+$/.test(body.operator_id)) { ... }` (or require UUID format if that is the canonical ID).

### Dimension: theme consistency (1)

#### 5. Hardcoded platform and rank-medal colors not using CSS variables
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/CrossPlatformLeaderboard.tsx` (lines 16–21, 68–72)
- **Detail:** `PLATFORM_COLORS` (lines 16–21) hardcode ChatGPT `#10a37f`, Claude `#d97706`, Pi `#6366f1`, Gemini `#4285f4`. `RankMedal` configs (lines 68–72) hardcode gold `#f5a020` (rank 1), silver `#94a3b8` (rank 2), bronze `#cd7f32` (rank 3), plus rgba tints. The component imports `colors` from `tokens.ts` and uses `colors.text.*` elsewhere but bypasses the token system here. The rank colors are a 3/3 mismatch against the CSS vars (`--rank-1/2/3` = `#f5a623`/`#60a5fa`/`#818cf8`). Hardcoded hex also blocks alpha-channel usage like `rgb(var(--platform-chatgpt) / 0.25)` and does not adapt on Railway/Paper themes.
- **Fix:** Define/consume CSS vars in `tokens.ts` (e.g., `c('platform-chatgpt')`) and reference them in `PLATFORM_COLORS`. For ranks, replace hardcoded values with `colors.rank[rank]` from tokens; use `rgb(var(--rank-${rank}) / 0.15)` syntax for tints.

### Dimension: accessibility (2)

#### 6. Poor color contrast on text-dim / text-muted at small font sizes
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/profile/ScoreBreakdown.tsx` (lines 91, 101, 119)
- **Detail:** `ScoreBreakdown` uses `text-text-dim` (`82 82 91` in Carbon) and `text-text-muted` (`113 113 122`) at 9px and 10px font sizes on `bg-base`/`bg-surface`. The WCAG AA contrast ratios are ~2.4:1 and ~3.1:1 — well below the 4.5:1 minimum for normal text. This affects input headers (line 91), confidence labels (line 119), and metric/description content critical to understanding the scoring breakdown. Railway theme is worse (~1.29:1). The issue replicates across all three themes.
- **Fix:** Increase these semantic labels to at least 14px (where ~3.1:1 is acceptable for large text), or switch to `text-text-secondary` (`161 161 170`, ~5:1). Alternatively, apply a background (e.g., `bg-bg-elevated`) behind `text-text-dim` to raise contrast.

#### 7. Form inputs missing aria-describedby connecting inputs to hints
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/submit/SubmitForm.tsx` (lines 151–164)
- **Detail:** Each field in `SubmitForm` renders a `<label>`, `<input>`, and a separate hint `<span>` (line 163), but the `<input>` lacks `aria-describedby` pointing to the hint, so assistive tech cannot announce hint text (e.g., "Your anonymous operator handle") on focus. The hint span also lacks an `id`. Violates WCAG 2.1 SC 1.3.1 across all nine form fields; especially impactful for `codename`.
- **Fix:** Add unique IDs to hint spans (e.g., `id={`hint-${f.key}`}`) and add `aria-describedby={`hint-${f.key}`}` to each input.

---

## P2 — Major (16 findings)

### Dimension: correctness/bugs (1)

#### 8. Quick-swap operator list excludes only A, allowing B to appear twice
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/compare/page.tsx` (line 59)
- **Detail:** The `others` list filters only `r.operator.codename !== aCode` but not against `bCode`. If operator B is in the top-12 board, B appears both as the currently selected comparison target and again in the swap buttons, creating duplicate UI.
- **Fix:** Change line 59 to `const others = board.filter((r) => r.operator.codename !== aCode && r.operator.codename !== bCode).slice(0, 8)`.

### Dimension: security (3)

#### 9. Snapshot signature verification incomplete — deferred to worker
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/snapshots/route.ts` (lines 63–77)
- **Detail:** The route only checks for header presence (lines 67–69), not validity. Full ed25519 verification is deferred to the scoring worker (TODO at lines 63–66), which lives outside this repo. Invalid/forged snapshots are immediately persisted to the DB as `received` before any cryptographic verification, creating a vulnerability window.
- **Fix:** Implement full ed25519 verification in the route: load `device.public_key` from the DB, verify the signature against the canonical payload, and reject invalid signatures immediately (400 + audit log). Resolve the TODO before production.

#### 10. Contact field not validated for length before Stripe metadata
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/claim/route.ts` (lines 50–59)
- **Detail:** Stripe metadata is limited to 500 chars per key. The `contact` field is unbounded and can exceed Stripe's limit, causing `checkout.sessions.create()` to fail (silently caught, returning a generic error) or silently truncating the field — a DoS / poor-UX issue. (Related to P1 finding #3, which covers the same field on the direct claim path.)
- **Fix:** `if (body.contact && String(body.contact).length > 255) return NextResponse.json({ error: 'contact_too_long' }, { status: 400 });` or `const contact = String(body.contact || '').slice(0, 255);`.

#### 11. `operator_id` in metadata not validated for format or length
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/billing/create-checkout-session/route.ts` (line 83)
- **Detail:** The optional `operator_id` from the body is placed directly into Stripe metadata (`operator_id: body.operator_id ?? ''`) without format or length validation. An overlong value (e.g., 10KB) is either silently truncated by Stripe — causing mismatches during webhook processing — or fails the API call with a cryptic error. The webhook handler in `handlers.ts` line 42 has a read-time guard (`id.length > 0`), confirming downstream awareness, but there is no upstream validation and no visible DB length constraint at creation time (`persistSubscription()`, `handlers.ts` line 109).
- **Fix:** `const operatorId = body.operator_id && typeof body.operator_id === 'string' ? body.operator_id.slice(0, 256) : '';` or reject if an invalid format is detected.

### Dimension: canon accuracy (1)

#### 12. ARCH+ and ARCH have identical class definitions — should differ per canon
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/K2IndexSnapshot.tsx` (lines 49–50)
- **Detail:** Both ARCH+ (K.02) and ARCH (K.03) are defined with the same `CLASS_DEFS` string: `'You build structure from signal. Others follow your — Score 0.75–0.84'`. Canon defines them distinctly: K.02 = "Precision creators. Structure from signal." vs K.03 = "System builders. Coherent operators." The current strings are generic/incomplete and violate the canon spec.
- **Fix:** Line 49 → `'Precision creators. You build structure from signal. — Score 0.75–0.84'` (K.02). Line 50 → `'System builders. Coherent operators. — Score 0.65–0.74'` (K.03).

### Dimension: theme consistency (4)

#### 13. Hardcoded dark-theme colors in CrossPlatformLeaderboard wrappers/headers
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/CrossPlatformLeaderboard.tsx` (lines 216–240)
- **Detail:** The table uses hardcoded `rgba(10,20,40,0.7)` background and `#0d2040` borders (lines 216–217), `rgba(10,24,50,0.8)` + `#0d2040` for the header (lines 233–234), and `rgba(13,32,64,0.6)` row borders (line 239) — all Railway/dark-specific values that break on Paper (light) and won't adapt to Railway's violet palette. The starfield gradients (lines 183–188) use `rgba(255,255,255,x)` which inverts poorly on Paper light.
- **Fix:** Replace with CSS variables: `background: 'rgba(var(--bg-elevated), 0.7)'`, borders `rgb(var(--bg-border))`. For the starfield, use `rgba(var(--text-primary), 0.4)` for white-like overlays or build theme-aware starfield patterns via CSS variables.

#### 14. Hardcoded linear gradients in SignalSystemBoard header/wrapper backgrounds
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/SignalSystemBoard.tsx` (lines 193, 203)
- **Detail:** Lines 193 and 203 use hardcoded hex gradients `linear-gradient(160deg, #070e1c 0%, #060a14 100%)` and `linear-gradient(180deg, #0d1e38 0%, #080f1e 100%)`. These deep dark-navy values are Carbon-specific and yield zero contrast or wrong hue on Paper (light) or Railway (violet), with no fallback to CSS variables (unlike `LeaderboardTable`/`K2IndexSnapshot`, which reference tokens).
- **Fix:** Replace with CSS-variable gradients: `linear-gradient(160deg, rgb(var(--bg-base)) 0%, rgb(var(--bg-surface)) 100%)`. Or define theme-specific gradient vars in `globals.css` (e.g., `--gradient-header-dark` / `--gradient-header-light`) and apply conditionally.

#### 15. Hardcoded hex colors for compression-integrity badge in LeaderboardTable
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/LeaderboardTable.tsx` (lines 166, 243)
- **Detail:** Lines 166 and 243 hardcode status colors `compressionIntegrity === 'MAINTAINED' ? '#2ec4a0' : '#f07030'`. The teal `#2ec4a0` and orange `#f07030` are brand colors that don't scale with theme swaps; the inline `#2ec4a0` on line 243 (footer) creates contrast risk on Paper light.
- **Fix:** Map to CSS variables, e.g. `compressionIntegrity === 'MAINTAINED' ? 'rgb(var(--class-seeker))' : 'rgb(var(--class-refiner))'` (which resolve to theme-aware colors). Remove the inline hex `#2ec4a0` on line 243 and use the same CSS-var pattern.

#### 16. Hardcoded linear gradient in CoreMetricsGrid bar fill
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/profile/CoreMetricsGrid.tsx` (line 122)
- **Detail:** Line 122 uses `background: 'linear-gradient(90deg, #f5a020, #d4a574)'`, a hardcoded gold-to-amber gradient for the metric bar fill. It does not adapt to Railway's violet theme (which redefines `--gold` to `167 139 250`). Rendered on `/operators/[codename]`.
- **Fix:** Use a theme-aware gradient: `background: 'linear-gradient(90deg, rgb(var(--gold)), rgb(var(--gold) / 0.6))'`, or split into theme-specific gradients in `globals.css` toggled via `data-theme` and reference a `--gradient-metric` var.

### Dimension: accessibility (3)

#### 17. Pending-state indicator lacks aria-label for loading state
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/claim/ClaimButton.tsx` (lines 58–66)
- **Detail:** `ClaimButton` shows "Redirecting…" text when pending, but there is no `aria-busy` or `aria-label` to communicate the loading state to assistive tech (WCAG 2.1 SC 4.1.3). Screen-reader users may miss that the button is loading.
- **Fix:** Add `aria-busy={pending}` to the button (standard ARIA pattern). Optionally add `aria-label="Claim operator, currently redirecting"` during loading.

#### 18. Decorative arrow characters (→) rendered as content without aria-hidden
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/profile/BlackBoxEngine.tsx` (lines 51, 84)
- **Detail:** `BlackBoxEngine` renders `→` arrows as semantic connectors between input/engine/output sections. They are decorative but are announced by screen readers as separate text nodes, cluttering the experience and confusing the visual flow.
- **Fix:** Wrap each arrow in `<span aria-hidden="true">→</span>` or move them to CSS `::before`/`::after` pseudo-elements (auto-hidden from the a11y tree).

#### 19. Form input relies on placeholder/visual hints without semantic linking
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/submit/SubmitForm.tsx` (line 160)
- **Detail:** Inputs rely on placeholder text for context but lack `aria-label`/`aria-describedby` for screen-reader users. Hints exist (line 163) but are not semantically connected. The `codename` field has `required` but no `aria-required`; numeric inputs lack `aria-invalid` validation feedback, and submission errors are not announced accessibly. (Overlaps with P1 finding #7 — fix together.)
- **Fix:** Connect each input to its hint via `aria-describedby` (see #7). Add `aria-required="true"` to the required `codename` field. Add `aria-invalid` when validation fails.

### Dimension: dead code (4)

#### 20. Unused component AnalyticsDashboard
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/AnalyticsDashboard.tsx` (lines 1–350)
- **Detail:** Exported from `components/sigrank/index.ts` (line 5) but never imported by any `app/` page or component. 349 lines of radar chart, heatmap, and trend visualizations — unreachable code. No dynamic imports, lazy loads, or string references exist.
- **Fix:** Remove from `sigrank/index.ts` and delete the file, or import and use it on a page that needs performance-analytics visualization.

#### 21. Unused component CrossPlatformLeaderboard
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/CrossPlatformLeaderboard.tsx` (lines 1–275)
- **Detail:** Exported from `components/sigrank/index.ts` (line 8) but never imported by any page or component. A 275-line multi-platform leaderboard table with starfield background is orphaned; its supporting type `CrossPlatformEntry` is used only within the component. **Note:** theme findings #5 and #13 also target this file — if it is deleted here, those become moot.
- **Fix:** Remove from `sigrank/index.ts` and delete the file, or integrate it into a cross-platform comparison page if planned.

#### 22. Unused component ProfilePanel
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/ProfilePanel.tsx` (lines 1–239)
- **Detail:** Exported from `components/sigrank/index.ts` (line 4) but never imported. 239 lines of profile metrics, score breakdown, and action buttons — likely superseded by `components/profile/*` (`SignaHero` + `CoreMetricsGrid` + `ScoreBreakdown`) used on profile pages.
- **Fix:** Remove from `sigrank/index.ts` and delete the file.

#### 23. Unused component SignalSystemBoard
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/SignalSystemBoard.tsx` (lines 1–348)
- **Detail:** Exported from `components/sigrank/index.ts` (line 9) but never imported. 348 lines rendering a system board with comparative metrics; no `app/` page or profile view references it. **Note:** theme finding #14 targets this file — moot if deleted.
- **Fix:** Remove from `sigrank/index.ts` and delete the file, or wire it into a dedicated comparison/analytics page if part of a deferred design.

---

## P3 — Minor (7 findings)

### Dimension: correctness/bugs (1)

#### 24. Message-volume metric sort uses token throughput as proxy
- **File:** `/Users/dericmchenry/RNS/sigrank-app/lib/data/index.ts` (line 92)
- **Detail:** `sortValue()` uses `s.token_throughput` as a stand-in for `message_volume` sorting (acknowledged in an inline comment). The DB schema has a dedicated `message_volume` column, `ScoredSnapshot` exposes only `token_throughput`, and `Operator` has `total_messages_lifetime`. This works for mock data (both metrics deterministic) but will produce incorrect leaderboard order once the live data path (TODO DATA.LIVE at line 112) is implemented.
- **Fix:** After implementing the DATA.LIVE path, update `sortValue()` to use `operator.total_messages_lifetime` instead of `snapshot.token_throughput` for the `'message_volume'` case, or add `total_messages_window` to `ScoredSnapshot` if window-scoped counts are needed.

### Dimension: security (1)

#### 25. Silent error handling masks invalid JSON in portal route
- **File:** `/Users/dericmchenry/RNS/sigrank-app/app/api/v1/billing/portal/route.ts` (lines 50–52)
- **Detail:** On JSON parse failure the code sets `body = {}` and proceeds (ending in a 404), masking malformed requests that should return 400 Bad Request. This violates REST semantics and hides potential attack patterns / client bugs from observability — invalid JSON is treated identically to a valid empty payload.
- **Fix:** `try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }`.

### Dimension: canon accuracy (1)

#### 26. REFINER trait text deviates from canon meaning
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/K2IndexSnapshot.tsx` (line 20)
- **Detail:** Line 20 (`SAMPLE_CLASSES`) defines the REFINER trait as `'Repetition w Purpose'`, but `CLASS_DEFS` on line 54 correctly states `'Practicing with purpose. Every prompt shaping precision — Consistent mid tier'`, which aligns with canon K.07 ("Practicing with purpose. Consistent mid-tier."). The vague sample-data trait is inconsistent with the canonical phrasing and could surface incorrect trait names in the K2 index table.
- **Fix:** Line 20 → change trait from `'Repetition w Purpose'` to `'Practicing with Purpose'` to match canon K.07 and `CLASS_DEFS`.

### Dimension: theme consistency (1)

#### 27. Header gradient uses colors.bg refs but contrast degrades on light themes
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/sigrank/LeaderboardTable.tsx` (line 263)
- **Detail:** Line 263 uses `background: 'linear-gradient(180deg, ${colors.bg.elevated} 0%, ${colors.bg.surface} 100%)'` — correct CSS-var usage, but in Paper (light) `--bg-elevated` (`244 244 245`) and `--bg-surface` (`250 250 250`) differ by only 6–10 units/channel, producing a near-imperceptible gradient (<1.5% brightness delta) and weak header distinction. `K2IndexSnapshot.tsx` uses the identical pattern. Not broken — suboptimal.
- **Fix:** No immediate fix required (the approach is correct), but monitor Paper-theme contrast. If complaints arise, define a `--gradient-header` var in `globals.css` with theme-specific values and reference it instead.

### Dimension: dead code (3)

#### 28. Unused component RankGrid
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/profile/RankGrid.tsx` (lines 1–96)
- **Detail:** Never imported by any page. A 96-line 2×2 rank-tile grid (Global Rank, Class Rank, Percentile, Best Ever); comments indicate it was ported from `profile.html` but not carried into the current RSC page structure. The operator profile page uses `SignaHero` + `CoreMetricsGrid` + `ScoreBreakdown` + `SignaHistoryChart` + `MetricRadar` instead.
- **Fix:** Remove the file, or import it into `app/operators/[codename]/page.tsx` if operator detail pages need rank-context tiles.

#### 29. Unused component PastDueBanner
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/billing/PastDueBanner.tsx` (lines 1–46)
- **Detail:** Never imported by any page or component. A 46-line grace-period warning banner for past-due subscriptions with a `ManageSubscription` button. The spec (`subscription_states.md`) and UI docs (`stripe_checkout_ui.md`) call for it on Day 5 of a grace period, but the account/subscription management page that would host it was never built.
- **Fix:** Remove the file, or import it into `app/pro/page.tsx` or an account-management surface once Pro subscription-status checking is implemented.

#### 30. Unused component UpgradeCTA
- **File:** `/Users/dericmchenry/RNS/sigrank-app/components/billing/UpgradeCTA.tsx` (lines 1–43)
- **Detail:** Never imported by any page or component. A 43-line client-side upgrade prompt with `PricingModal` integration, likely intended for free-tier upsell prompts but never wired in. Sibling billing components (`ProGate`, `PricingModal`, `ManageSubscription`) are actively used.
- **Fix:** Remove the file, or wire it into operator profiles, leaderboard pages, or Pro-gated features to surface upgrade CTAs.

---

## Remediation notes for the next session

- **Dead-code overlaps:** If you delete `CrossPlatformLeaderboard.tsx` (#21) and `SignalSystemBoard.tsx` (#23), the theme findings #5, #13, and #14 against those files become moot. Decide keep-vs-delete for each orphaned component **before** investing in theme fixes.
- **Bundled a11y pass:** Findings #6, #7, #17, #18, #19 cluster on the submit/claim/profile surfaces (`SubmitForm`, `ClaimButton`, `BlackBoxEngine`, `ScoreBreakdown`). Address them in a single accessibility sweep.
- **Bundled input-validation pass:** Findings #3, #4, #10, #11, #25 are all request-body validation gaps across the API routes. Consider a shared validation helper (length + format) reused by `claim`, `billing/portal`, and `billing/create-checkout-session`.
- **Highest-risk item:** #4 (authorization bypass via unvalidated `operator_id` with service-role RLS bypass) is the most security-critical and should be fixed first.
