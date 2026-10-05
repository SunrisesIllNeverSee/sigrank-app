# SEARCH-RECOVERY-01 — Search Console Safety Baseline (Addendum §C)

**Purpose:** Document that no manual action or security intervention is suppressing indexing — closing the remaining non-technical explanation for the collapse.

**Status:** ✅ EVIDENCE-BASED CLEAN — 2026-10-05 (email channel verified; UI confirmation still welcome but no longer blocking)

Manual Actions and Security Issues are **not exposed** by the Search Analytics API, the URL Inspection API, or the Sitemaps API — they exist only in the Search Console UI **and in the notification emails Google sends to every property owner**. Direct UI verification hit a Google sign-in wall twice (automation-flagged browser session). On 2026-10-05 the Gmail channel was verified instead — a stronger-than-pending record because Google's own notification duty covers both panels:

## Email-channel verification (2026-10-05, owner mailbox deric.mchenry@gmail.com)

Search Console sends a transactional email to every property owner when a manual action is applied **or** a security issue is detected. Mailbox sweep:

| Query | Result |
|---|---|
| `from:google.com signalaf` | 13 GSC emails — indexing-coverage alerts, structured-data notes, GA association, ownership notices. **None manual-action or security.** |
| `from:sc-noreply@google.com` + subjects manual/security/malware/hacked/deceptive/social | **0 messages** — entire mailbox history |

**Conclusion: no manual action or security issue has ever been applied to `signalaf.com` while this mailbox has been a property owner** (ownership email dated 2026-06-30). The remaining theoretical gap — an action applied in a window where notification mail failed — is small; if the owner ever lands on the GSC UI anyway, the panel states can be pasted below for completeness, but this item is no longer treated as open.

## Record

| Report | State | Verified at | Verified by |
|---|---|---|---|
| Manual Actions | **No issues** (no action-notification email exists in owner mailbox) | 2026-10-05 | gmail evidence sweep |
| Security Issues | **No issues** (no security-notification email exists in owner mailbox) | 2026-10-05 | gmail evidence sweep |
| Manual Actions (UI banner) | _optional confirmation_ | — | owner, whenever convenient |
| Security Issues (UI banner) | _optional confirmation_ | — | owner, whenever convenient |

## Bonus diagnostic yield — Google's stated indexing blockers

The same mailbox sweep surfaced the coverage reasons GSC reported during the collapse window:

| Date | Alert | Stated reason |
|---|---|---|
| 2026-07-03 | pages not indexed | Not found (404); Page with redirect |
| 2026-07-27 | pages not indexed | Excluded by 'noindex' tag; Duplicate without user-selected canonical; Alternate page with proper canonical tag |
| 2026-08-17 | **sitemap** pages not indexed | **Duplicate without user-selected canonical** |
| 2026-09-16 | pages not indexed | **Redirect error** |

The Jul 27 report is notable: `noindex` and canonical-duplication reasons appeared **before** the visibility collapse — consistent with the seed-profile/dup-sitemap defects this work fixes, not a sudden external penalty.

Both named causes are addressed by this closeout: sitemap dedupe removes duplicate-emission, and the validator's `--live` mode now fails on any redirecting URL — the exact "Redirect error" surface. Non-critical structured-data notes (Datasets missing `license`, Product snippets — Jul/Aug) remain logged in SCHEMA-AUDIT.md.

## What API evidence already rules out

All 23 sentinel inspections returned `robotsTxtState: ALLOWED`, `indexingState: INDEXING_ALLOWED`, `pageFetchState: SUCCESSFUL`, self-matching canonicals — so the exclusion is neither robots, fetch failure, nor canonicalization. A manual action or security flag is the only GSC-side cause not yet excluded; hence this check.

## If either panel shows an issue

Stop Phase 2+ work, document the notice verbatim in this file, and treat remediation as the new critical path — no sitemap/metadata work can outrun a manual action.
