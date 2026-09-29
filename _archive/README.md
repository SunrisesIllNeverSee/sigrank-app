# `_archive/` — the single archive namespace

Consolidated in PR-4 (was `_archived/` + `_archive/` + root strays). Everything
here is inactive — kept for history/reference, nothing executes or deploys.

| Subdir | Contents |
|---|---|
| `workflows/` | 8 retired GitHub Actions workflows (see `.github/workflows/ci.yml` + `sync-mcp-version.yml` for what is live) |
| `docs/` | Historical docs + one-off reports (`STATIC-BOARD-MIGRATION.md`, `posthog-mcp-analytics-report.md`) |
| `config/` | Dead configs of archived tooling (`lighthouserc.json` → lighthouse.yml; `.gitleaks.*` → archived gitleaks job) |
| `blog-drafts/` | Undeployed blog drafts (`.md` + `.html`) |

Rules: files here are frozen snapshots — do not edit them; restore = move the
file back. If you restore `workflows/lighthouse.yml` or the gitleaks job, grab
the matching config from `config/`.
