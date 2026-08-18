#!/bin/bash
set -euo pipefail
build="${1:-}"; hub="${2:-}"
[ -n "$build" ] && [ -n "$hub" ] || { echo "usage: $0 BUILD_ID HUB_PATH" >&2; exit 2; }
mkdir -p "$hub/handoffs"
today="$(date -u +%Y-%m-%d)"
cat > "$hub/HUB.yaml" <<EOF
macro_hub:
  build_id: "$build"
  created: "$today"
  status: active
EOF
printf 'system_id\trepo_path\trole\tstatus\n' > "$hub/SYSTEMS.tsv"
cat > "$hub/MACRO_BUS.md" <<EOF
---
type: Coordination
title: Macro Coordination Bus — $build
description: Shared cross-repository coordination bus for build $build.
tags: [repo-standard, macro, coordination]
timestamp: $today
---

# Macro Coordination Bus — $build

## Protocol

Participants append only material cross-system assignments, blockers, dependency changes, and handoffs.

## Log

EOF
cat > "$hub/MACRO_STATE.md" <<EOF
---
type: State
title: Macro Build State — $build
description: Shared current state for cross-repository build $build.
tags: [repo-standard, macro, state]
timestamp: $today
---

# Macro Build State — $build

## Objective
-

## Active systems
-

## Critical path
-

## Cross-system blockers
-

## Next integration point
-
EOF
echo "macro hub initialized: $hub"
