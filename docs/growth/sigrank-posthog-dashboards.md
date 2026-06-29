# SigRank — PostHog Dashboard & Insight Definitions

> Companion to `sigrank-gtm-instrumentation-plan.md`. Recreate these in the PostHog UI after Phases 1–4 ship.
> Each insight lists: **Type · Series/Events · Math · Breakdown · Filters · "Good" target.**
> Event taxonomy used (from the plan): `$pageview`, `operator_enrolled`, `snapshot_submitted`,
> `board_viewed`, `profile_viewed`, `profile_shared`, `wrapped_viewed`, `upgrade_viewed`,
> `checkout_clicked`, `checkout_started`, `subscription_activated`.

---

## Global setup (do once)

**Project filters / test hygiene**
- Create a **cohort `Internal`** = persons whose `distinct_id` is you/teammates (and any seeded test codenames). Add `Exclude: Internal` to every insight below.
- If you run a Stripe **test** tier, tag `subscription_activated` with `mode: 'test'|'live'` and filter `mode = live` on revenue insights.

**Actions to create** (Data management → Actions — lets you rename without touching code):
- `Activated` = first `snapshot_submitted`
- `Shared` = `profile_shared`
- `Paid` = `subscription_activated`

**Cohorts to create**
| Cohort | Definition |
|---|---|
| `Activated operators` | performed `snapshot_submitted` ≥ 1 (ever) |
| `Recurring submitters` | `snapshot_submitted` ≥ 2 in last 30d |
| `Paying operators` | performed `subscription_activated`, `mode = live` |
| `AI-sourced` | first-touch `utm_source = ai` (see SQL in §9) |
| `Sharers` | performed `profile_shared` |

---

## Dashboard 1 — North Star & Activation

### 1.1 North Star — Weekly Active Submitters  ⭐
- **Type:** Trends · line
- **Series:** `snapshot_submitted` · **Math: Unique users (WAU)**
- **Interval:** Weekly · **Range:** last 12 weeks
- **Good:** up and to the right; this is the single number to grow.

### 1.2 Activation funnel  ⭐ (your #1 diagnostic)
- **Type:** Funnel
- **Steps (ordered):**
  1. `$pageview`
  2. `operator_enrolled`
  3. `snapshot_submitted`
- **Conversion window:** 7 days · **Order:** sequential
- **Breakdown (toggle):** by `utm_source` (which channel activates best)
- **Watch:** the **step 2→3 (enroll→submit)** rate. That's the leak. **Good: >60%.** Below 40% = onboarding friction between getting a key and first submit.

### 1.3 Enroll → Submit conversion (single number tile)
- **Type:** Funnel → "trends" view of the 2→3 conversion, OR Trends **Formula**:
  - A = `snapshot_submitted` unique users; B = `operator_enrolled` unique users; **Formula `A / B`**, display as %.
- **Interval:** Weekly · pin as a big-number tile.

### 1.4 Time-to-activation
- **Type:** Funnel · enable **"Time to convert"** on the enroll→submit step.
- **Good:** median < 1 day. A long tail = people enroll, get distracted, never submit → trigger a reminder.

### 1.5 New operators / week
- **Type:** Trends · `operator_enrolled` where `first_enroll = true` · **Math: Total count** · Weekly.

---

## Dashboard 2 — Retention & Engagement

### 2.1 Submitter retention  ⭐
- **Type:** Retention
- **Cohortizing event (Start):** `snapshot_submitted`
- **Returning event:** `snapshot_submitted`
- **Period:** Weekly · **Range:** 8 weeks
- **Good:** Week-1 retention > 30%, flattening (not decaying to 0) = a real recurring-usage product. Mirrors your 7/30/90 board windows.

### 2.2 Board engagement by window
- **Type:** Trends · bar
- **Series:** `board_viewed` · **Math: Total count** · **Breakdown by `window`** (7d/30d/90d/all/off)
- **Use:** which board window people actually look at → informs default board + sitemap priority.

### 2.3 Profile views: own vs others
- **Type:** Trends · `profile_viewed` · **Breakdown by `is_own`**
- **Signal:** lots of `is_own=true` = operators checking their rank (engagement/vanity loop, good for retention); `is_own=false` = discovery.

### 2.4 Stickiness (DAU/WAU)
- **Type:** Stickiness · `snapshot_submitted` · weekly
- **Good:** rising = operators submitting on more days.

---

## Dashboard 3 — Viral / Referral Loop

### 3.1 Share rate
- **Type:** Trends **Formula**: A = `profile_shared` (unique users) ÷ B = `profile_viewed` (unique users) → %.
- **Good:** the share leg of the loop is alive if > ~10%.

### 3.2 Shares by channel
- **Type:** Trends · `profile_shared` · **Breakdown by `channel`** (copy/x/etc.)

### 3.3 Share → Enroll attribution (the loop closes?)
PostHog's UI can't easily express "shared link caused an enroll," so use a **HogQL/SQL insight**:
```sql
-- New enrolls whose first session landed on a /user/ (shared) profile URL
select toStartOfWeek(timestamp) as week, count() as enroll_from_share
from events
where event = 'operator_enrolled'
  and person_id in (
    select person_id from events
    where event = '$pageview'
      and properties.$referrer like '%/user/%'
  )
group by week order by week
```
- **Good:** non-zero and growing = the viral loop compounds. Pair with 3.1 to see share→enroll throughput.

### 3.4 Wrapped impact
- **Type:** Funnel · `wrapped_viewed` → `profile_shared` · 1-day window. (Is `/wrapped` a share driver?)

---

## Dashboard 4 — Revenue

### 4.1 Revenue funnel  ⭐
- **Type:** Funnel
- **Steps:** `upgrade_viewed` → `checkout_clicked` → `checkout_started` → `subscription_activated`
- **Filter:** `mode = live` on the last step · **Window:** 1 day
- **Breakdown:** by `tier` (which plan converts)
- **Watch:** `checkout_started → subscription_activated` (payment failures/abandonment) and `upgrade_viewed → checkout_clicked` (pricing-page persuasion).

### 4.2 Free → Paid conversion
- **Type:** Trends **Formula**: A = `subscription_activated` unique users ÷ B = `Activated operators` cohort size → %.

### 4.3 New MRR proxy
- **Type:** SQL insight (PostHog can't sum subscription value natively without revenue tracking):
```sql
select toStartOfMonth(timestamp) as month,
       sum(toFloat(properties.amount)) as new_mrr
from events
where event = 'subscription_activated' and properties.mode = 'live'
group by month order by month
```
> If you adopt PostHog's native **Revenue analytics** later, switch this to the Stripe integration for true MRR/churn.

### 4.4 Time-to-paid
- **Type:** Funnel "time to convert" on `operator_enrolled` → `subscription_activated` (30-day window). Median = how long trust takes to build.

---

## Dashboard 5 — Acquisition channels (where GTM meets the funnel)

### 5.1 Enrolls by channel  ⭐
- **Type:** Trends · `operator_enrolled` · **Breakdown by `utm_source`** (ai / community / outbound / direct)
- **This is how you prove Profound/Common Room/Clay work** — each channel's enrolls, side by side.

### 5.2 AI-search attribution (Profound's scoreboard)
- **Type:** Trends · `operator_enrolled` filtered `utm_source = ai` · weekly.
- Overlay with your recurring Profound Visibility score (track manually or annotate) to correlate "AI visibility up → AI enrolls up."

### 5.3 Top landing pages for converters
- **Type:** Paths OR SQL — first `$pathname` of sessions that later `operator_enrolled`. Tells you which content (a wiki page? a profile?) actually converts → double down for SEO/AEO.

### 5.4 Channel → activation quality
- **Type:** Funnel `$pageview → snapshot_submitted`, **Breakdown by `utm_source`**. Not all channels activate equally — a channel with high enrolls but low submits is low-quality traffic.

---

## Suggested dashboard layout

| Dashboard | Pin these tiles | Review cadence |
|---|---|---|
| **North Star** (exec) | 1.1, 1.2, 2.1, 4.2, 5.1 | weekly |
| **Activation** | 1.2, 1.3, 1.4, 1.5 | weekly |
| **Retention** | 2.1, 2.2, 2.4 | biweekly |
| **Viral loop** | 3.1, 3.3, 3.4 | biweekly |
| **Revenue** | 4.1, 4.2, 4.3 | monthly |
| **Channels** | 5.1, 5.2, 5.4 | weekly (GTM standup) |

---

## "What good looks like" cheat-sheet
| Metric | Insight | Healthy |
|---|---|---|
| Enroll → first submit | 1.2 step 2→3 | > 60% |
| Time to activation | 1.4 | median < 1 day |
| Week-1 submitter retention | 2.1 | > 30%, flattening |
| Share rate | 3.1 | > 10% |
| Share → enroll | 3.3 | non-zero, growing |
| Free → paid | 4.2 | 1–3% (PLG dev tool) |
| AI-sourced enrolls | 5.2 | rising after Profound runs |

---

## Build order
1. Global setup (cohorts, actions, Internal exclusion) — 15 min.
2. Dashboard 1 (Activation) — this is the one that changes decisions. Build it first.
3. Dashboard 5 (Channels) — so the moment Profound/Common Room run, you can see them land.
4. Dashboards 2, 3, 4 — once you have a few weeks of data (retention/funnels need volume).

> Tip: set **dashboard date range to "Last 12 weeks"** globally and add a **week-over-week % comparison** on the North Star tiles so you read trend, not absolute noise.
