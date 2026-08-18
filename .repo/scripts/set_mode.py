#!/usr/bin/env python3
from pathlib import Path
import re, sys
from repo_lib import repo_root
if len(sys.argv)!=2 or sys.argv[1] not in {'migrate','enforce'}:
    raise SystemExit('usage: python3 .repo/scripts/set_mode.py migrate|enforce')
r=repo_root(); p=r/'REPO.yaml'; s=p.read_text();
s2=re.sub(r'(?m)^(\s*mode:\s*).+$',rf'\g<1>{sys.argv[1]}',s,count=1)
if s2==s: raise SystemExit('could not find standard.mode in REPO.yaml')
p.write_text(s2); print('mode =',sys.argv[1])
