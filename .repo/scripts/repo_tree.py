#!/usr/bin/env python3
from pathlib import Path
from repo_lib import repo_root
r=repo_root(); skip={'.git','node_modules','.next','dist','build','.venv','venv'}
print(r.name+'/')
for p in sorted(r.iterdir(),key=lambda p:p.name.lower()):
    if p.name in skip: continue
    print(('├── ' if p!=sorted([x for x in r.iterdir() if x.name not in skip],key=lambda x:x.name.lower())[-1] else '└── ')+p.name+('/' if p.is_dir() else ''))
