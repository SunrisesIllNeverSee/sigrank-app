#!/bin/bash
set -euo pipefail
summary="${*:-state saved}"; repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; base="$repo/.coord/micro"; now="$(date -u '+%Y-%m-%d %H:%M UTC')"
python3 - "$base/STATE.md" "$summary" "$now" <<'PY'
from pathlib import Path
import sys,re
p=Path(sys.argv[1]); summary=sys.argv[2]; now=sys.argv[3]; s=p.read_text()
marker='## Latest Save\n'
block=f'## Latest Save\n\n- Time: {now}\n- Summary: {summary}\n\n'
if marker in s: s=s[:s.index(marker)]+block
else: s+='\n'+block
p.write_text(s)
PY
echo "state saved"
