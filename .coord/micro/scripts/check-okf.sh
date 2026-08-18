#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
python3 - "$repo" <<'PY'
from pathlib import Path
import sys
r=Path(sys.argv[1]); req=['type:','title:','description:','tags:','timestamp:']; bad=[]
for base in [r/'docs',r/'.coord']:
 if not base.exists(): continue
 for p in base.rglob('*.md'):
  if p.name=='README.md': continue
  s=p.read_text(errors='replace')
  if not s.startswith('---') or s.count('---')<2 or not all(x in s.split('---',2)[1] for x in req): bad.append(p.relative_to(r))
for p in bad: print('OKF violation:',p)
print(f'{len(bad)} violation(s)')
raise SystemExit(1 if bad else 0)
PY
