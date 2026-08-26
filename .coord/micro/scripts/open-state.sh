#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"
cat "$base/STATE.md"; echo; tail -60 "$base/SCRATCHPAD.md"; echo; bash "$base/scripts/handoff.sh" current || true
