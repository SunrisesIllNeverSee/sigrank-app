#!/bin/bash
set -euo pipefail
summary="${*:-session complete}"; repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"; state="$base/state"
sid=""; [ -f "$state/.session-current" ] && sid="$(cat "$state/.session-current")"; role="UNKNOWN"; [ -n "$sid" ] && [ -f "$state/.role-$sid" ] && role="$(cat "$state/.role-$sid")"
now="$(date -u '+%Y-%m-%d %H:%M UTC')"
printf '\n### ⤷ %s → ALL: signout (%s)\n%s\n' "$role" "$now" "$summary" >> "$base/SCRATCHPAD.md"
[ -n "$sid" ] && rm -f "$state/.role-$sid"
echo "signed out: $role"
