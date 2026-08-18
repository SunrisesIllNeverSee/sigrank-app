#!/bin/bash
set -euo pipefail
hub="${1:-}"; system="${2:-}"; repo_path="${3:-}"; role="${4:-participant}"
[ -n "$hub" ] && [ -n "$system" ] && [ -n "$repo_path" ] || { echo "usage: $0 HUB_PATH SYSTEM_ID REPO_PATH [ROLE]" >&2; exit 2; }
[ -f "$hub/SYSTEMS.tsv" ] || { echo "hub not initialized: $hub" >&2; exit 2; }
if grep -q "^${system}[[:space:]]" "$hub/SYSTEMS.tsv" 2>/dev/null; then
  echo "system already registered: $system"; exit 0
fi
printf '%s\t%s\t%s\t%s\n' "$system" "$repo_path" "$role" active >> "$hub/SYSTEMS.tsv"
echo "registered $system"
