#!/bin/bash
set -euo pipefail
role="${1:-}"; case "$role" in OWNER|LEAD|ASSIST) ;; *) echo "usage: $0 OWNER|LEAD|ASSIST" >&2; exit 2;; esac
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; state="$repo/.coord/micro/state"; mkdir -p "$state"
sid=""; [ -f "$state/.session-current" ] && sid="$(head -1 "$state/.session-current" | tr -d '[:space:]')"
if [ -z "$sid" ]; then sid="session-$(date -u +%Y%m%d%H%M%S)-$$"; printf '%s\n' "$sid" > "$state/.session-current"; fi
printf '%s\n' "$role" > "$state/.role-$sid"
echo "role=$role session=$sid"
