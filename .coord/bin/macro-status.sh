#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; f="$repo/.coord/macro/LINK.yaml"; [ -f "$f" ] || { echo '(macro link missing)'; exit 1; }
cat "$f"; hub="$(awk -F': ' '/hub_path:/{gsub(/"/,"",$2); print $2; exit}' "$f")"
if [ -n "$hub" ]; then
 echo "hub: $hub"; [ -e "$hub" ] && echo 'hub reachable: yes' || echo 'hub reachable: no'
fi
