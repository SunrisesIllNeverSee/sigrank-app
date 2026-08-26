#!/bin/bash
set -euo pipefail
q="${1:-}"; [ -n "$q" ] || { echo "usage: $0 QUERY" >&2; exit 2; }
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
grep -RIni --include='*.md' --exclude-dir=.git --exclude-dir=node_modules -- "$q" "$repo/docs" "$repo/.coord" 2>/dev/null || true
