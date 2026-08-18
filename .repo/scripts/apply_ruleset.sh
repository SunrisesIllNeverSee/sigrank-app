#!/bin/bash
set -euo pipefail
profile="${1:-solo-fast}"; owner="${2:-}"; repo="${3:-}"
if [ -z "$owner" ] || [ -z "$repo" ]; then echo "usage: $0 solo-fast|team-safe|strict OWNER REPO" >&2; exit 2; fi
case "$profile" in solo-fast|team-safe|strict) ;; *) echo "invalid profile" >&2; exit 2;; esac
command -v gh >/dev/null || { echo "gh CLI required" >&2; exit 2; }
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
payload="$root/.github/rulesets/$profile.json"
[ -f "$payload" ] || { echo "ruleset payload missing: $payload" >&2; exit 2; }
echo "About to create repository ruleset '$profile' on $owner/$repo."
echo "This is an external governance change. Re-run with APPLY=1 to execute."
if [ "${APPLY:-0}" != "1" ]; then exit 0; fi
gh api --method POST -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2026-03-10' \
  "/repos/$owner/$repo/rulesets" --input "$payload"
