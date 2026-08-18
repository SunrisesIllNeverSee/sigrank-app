#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"; dir="$base/handoffs"; mkdir -p "$dir/active" "$dir/archive"
cmd="${1:-current}"; role="${2:-LEAD}"
case "$cmd" in
 generate)
   now="$(date -u '+%Y-%m-%d_%H%M')"; file="$dir/active/HANDOFF_${role}_${now}.md"
   for old in "$dir/active"/HANDOFF_${role}_*.md; do [ -f "$old" ] || continue; mv "$old" "$dir/archive/"; done
   cat > "$file" <<EOF
---
type: Handoff
title: ${role} Handoff ${now}
description: Active handoff for the next ${role} session.
tags: [repo-standard, coordination, handoff]
timestamp: $(date -u '+%Y-%m-%d')
---

# ${role} Handoff

## Current state
-

## Completed
-

## Next
-

## Blockers / cautions
-

## Key files
-
EOF
   echo "$file" ;;
 current)
   f="$(ls -1t "$dir/active"/*.md 2>/dev/null | head -1 || true)"; [ -n "$f" ] && cat "$f" || echo '(no active handoff)' ;;
 list) find "$dir" -type f -name 'HANDOFF_*.md' -print | sort ;;
 *) echo "usage: $0 generate ROLE|current|list" >&2; exit 2;;
esac
