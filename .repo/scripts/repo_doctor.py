#!/usr/bin/env python3
from pathlib import Path
from repo_lib import repo_root, config, profile, deepget
import shutil, subprocess
r=repo_root(); c=config(r)
print('Repo:',r)
print('Name:',deepget(c,'repo.name','?'))
print('Type:',deepget(c,'repo.type','?'))
print('Mode:',deepget(c,'standard.mode','?'))
for cmd in ['git','python3','node','jq','gh']:
    print(f'{cmd:8}', shutil.which(cmd) or 'not found')
try:
    p=profile(r,c); print('Profile: OK -',p['type'])
except Exception as e: print('Profile: ERROR -',e)
print('Micro:', 'enabled' if deepget(c,'coordination.micro_enabled',True) else 'disabled')
print('Macro:', 'enabled' if deepget(c,'coordination.macro_enabled',True) else 'disabled')
if (r/'.git').exists():
    try:
        b=subprocess.check_output(['git','-C',str(r),'branch','--show-current'],text=True).strip(); print('Branch:',b or '(detached)')
    except: pass
