#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"; f="$base/SCRATCHPAD.md"; max="${1:-1200}"; lines="$(wc -l < "$f" | tr -d ' ')"
[ "$lines" -gt "$max" ] || { echo "scratchpad $lines/$max lines; no archive needed"; exit 0; }
mkdir -p "$base/scratchpad-archive"; stamp="$(date -u +%Y-%m-%d_%H%M%S)"; cp "$f" "$base/scratchpad-archive/SCRATCHPAD_$stamp.md"
head -30 "$f" > "$f.tmp"; printf '\n## Log\n\nArchived previous log to `scratchpad-archive/SCRATCHPAD_%s.md`.\n' "$stamp" >> "$f.tmp"; mv "$f.tmp" "$f"; echo "archived"
