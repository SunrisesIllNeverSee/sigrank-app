#!/bin/bash
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"; out="$repo/.coord/micro/INDEX.md"; today="$(date -u +%Y-%m-%d)"
python3 - "$repo" "$out" "$today" <<'PY'
from pathlib import Path
import sys
r=Path(sys.argv[1]); out=Path(sys.argv[2]); today=sys.argv[3]; skip={'.git','node_modules','dist','build','.next','archive','_archive'}; rows=[]
for p in r.rglob('*.md'):
 rel=p.relative_to(r)
 if any(x in skip for x in rel.parts) or p==out: continue
 s=p.read_text(errors='replace')
 if not s.startswith('---'): continue
 fm=s.split('---',2)[1]
 vals={}
 for line in fm.splitlines():
  if ':' in line:
   k,v=line.split(':',1); vals[k.strip()]=v.strip().strip('"')
 rows.append((vals.get('type','?'),vals.get('title',p.stem),str(rel)))
rows.sort()
text=(
 '---\n'
 'type: Index\n'
 'title: Repository Knowledge Index\n'
 'description: Auto-generated index of OKF Markdown knowledge objects.\n'
 'tags: [repo-standard, coordination, index]\n'
 f'timestamp: {today}\n'
 '---\n\n'
 '# Repository Knowledge Index\n\n'
 '| Type | Title | Path |\n'
 '|---|---|---|\n'
)
for t,title,path in rows: text+=f'| {t} | {title.replace("|","/")} | `{path}` |\n'
out.write_text(text)
print(f'indexed {len(rows)} docs -> {out}')
PY
