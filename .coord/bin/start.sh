#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; role="${1:-LEAD}"
bash "$repo/.coord/micro/scripts/set-role.sh" "$role"
python3 "$repo/.repo/scripts/repo_doctor.py"
bash "$repo/.coord/micro/scripts/status.sh"
echo; echo '--- MACRO ---'; bash "$repo/.coord/bin/macro-status.sh"
