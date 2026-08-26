#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"
echo '--- ROSTER ---'; cat "$base/state/ROSTER.md" 2>/dev/null || true
echo; echo '--- ACTIVITY (last 30) ---'; tail -30 "$base/state/ACTIVITY.log" 2>/dev/null || echo '(none yet)'
echo; echo '--- SCRATCHPAD (last 40) ---'; tail -40 "$base/SCRATCHPAD.md" 2>/dev/null || true
