#!/bin/bash
set -euo pipefail
build="${1:-}"; system="${2:-}"; mode="${3:-participant}"; hub="${4:-}"
[ -n "$build" ] && [ -n "$system" ] || { echo "usage: $0 BUILD_ID SYSTEM_ID participant|hub [HUB_PATH]" >&2; exit 2; }
case "$mode" in participant|hub|standalone) ;; *) echo "invalid mode" >&2; exit 2;; esac
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; f="$repo/.coord/macro/LINK.yaml"
cat > "$f" <<EOF
macro:
  mode: $mode
  build_id: "$build"
  system_id: "$system"
  hub_path: "$hub"
EOF
echo "macro link updated: $build / $system / $mode"
