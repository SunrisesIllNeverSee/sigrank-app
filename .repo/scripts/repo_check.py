#!/usr/bin/env python3
from pathlib import Path
import argparse, os, re, subprocess, sys
from repo_lib import repo_root, config, profile, deepget

DOC_EXT={'.md','.pdf','.docx','.pptx','.xlsx','.csv','.txt','.rtf'}
DUP_RE=re.compile(r'(?i)(?:[_ .-](?:final\d*|new|updated|revised|copy\d*)|\s*\(\d+\))(?=\.[^.]+$|$)')
SKIP={'.git','node_modules','.next','dist','build','coverage','.venv','venv','vendor'}

def changed_since(root, base):
    if not base: return set()
    try:
        out=subprocess.check_output(['git','-C',str(root),'diff','--name-only',f'{base}...HEAD'],text=True,stderr=subprocess.DEVNULL)
        return {x.strip() for x in out.splitlines() if x.strip()}
    except Exception: return set()

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--ci',action='store_true'); ap.add_argument('--base',default=os.getenv('REPO_STANDARD_BASE','')); args=ap.parse_args()
    root=repo_root(); cfg=config(root)
    if not cfg:
        print('ERROR REPO.yaml missing'); return 2
    try: prof=profile(root,cfg)
    except Exception as e: print(f'ERROR {e}'); return 2
    mode=str(deepget(cfg,'standard.mode','migrate')).lower()
    extra_dirs=set(deepget(cfg,'structure.allowed_root_dirs_extra',[]) or [])
    extra_files=set(deepget(cfg,'structure.allowed_root_files_extra',[]) or [])
    allowed_dirs=set(prof['allowed_root_directories'])|extra_dirs
    allowed_files=set(prof['allowed_root_files'])|extra_files
    errors=[]; warnings=[]
    def issue(msg, hard=True):
        (errors if hard and mode=='enforce' else warnings).append(msg)

    for key in ('document_roots','artifact_roots','archive_roots'):
        for configured in (deepget(cfg,f'structure.{key}',[]) or []):
            top=str(configured).split('/',1)[0]
            if top and top not in allowed_dirs:
                issue(f'REPO.yaml structure.{key} points to root not allowed by profile: {configured}')

    for req in prof.get('required_files',[]):
        if not (root/req).exists(): issue(f'missing required root file: {req}')

    for p in sorted(root.iterdir(), key=lambda x:x.name.lower()):
        n=p.name
        if p.is_dir():
            if n not in allowed_dirs: issue(f'unapproved root directory: {n}/')
        else:
            if n in allowed_files: continue
            if p.suffix.lower() in DOC_EXT:
                issue(f'loose root document/artifact: {n}')
            else:
                warnings.append(f'unrecognized root file (review/add explicitly if legitimate): {n}')

    forbid=bool(deepget(cfg,'naming.forbid_version_suffixes',True))
    if forbid:
        for p in root.rglob('*'):
            if not p.is_file(): continue
            rel=p.relative_to(root)
            if any(part in SKIP for part in rel.parts): continue
            if 'archive' in [x.lower() for x in rel.parts] or '_archive' in [x.lower() for x in rel.parts]: continue
            if p.suffix.lower() in DOC_EXT and DUP_RE.search(p.name):
                issue(f'forbidden version/copy suffix: {rel}')

    # Coordination integrity
    if deepget(cfg,'coordination.micro_enabled',True):
        mr=Path(str(deepget(cfg,'coordination.micro_root','.coord/micro')))
        for f in ['SCRATCHPAD.md','STATE.md','OKF.md','state/ROSTER.md']:
            if not (root/mr/f).exists(): issue(f'micro coordination file missing: {mr/f}')
    if deepget(cfg,'coordination.macro_enabled',True):
        mr=Path(str(deepget(cfg,'coordination.macro_root','.coord/macro')))
        for f in ['LINK.yaml','MACRO_STATE.md']:
            if not (root/mr/f).exists(): issue(f'macro coordination file missing: {mr/f}')
    for old in ['SCRATCHPAD.md','STATE.md','OKF.md','ROSTER.md']:
        if (root/old).exists(): issue(f'legacy coordination file at root; move into .coord/: {old}')

    # Lightweight OKF check. Warnings by default so adoption does not block existing docs.
    okf_enabled=bool(deepget(cfg,'knowledge.okf_enabled',True)); okf_sev=str(deepget(cfg,'knowledge.okf_severity','warn')).lower()
    okf_roots=deepget(cfg,'knowledge.okf_roots',['docs','.coord']) or []
    if okf_enabled:
        required=('type:','title:','description:','tags:','timestamp:')
        for rr in okf_roots:
            base=root/str(rr)
            if not base.exists(): continue
            for p in base.rglob('*.md'):
                rel=p.relative_to(root)
                if any(part in SKIP for part in rel.parts): continue
                if p.name.upper() in {'README.MD'}: continue
                text=p.read_text(encoding='utf-8',errors='replace')
                ok=text.startswith('---\n') and all(k in text.split('---',2)[1] for k in required) if text.startswith('---') and text.count('---')>=2 else False
                if not ok:
                    msg=f'OKF frontmatter incomplete: {rel}'
                    if okf_sev=='error': issue(msg)
                    else: warnings.append(msg)

    changed=changed_since(root,args.base)
    if changed:
        archives=[str(x).rstrip('/') for x in (deepget(cfg,'structure.archive_roots',[]) or [])]
        for c in sorted(changed):
            if any(c==a or c.startswith(a+'/') for a in archives): warnings.append(f'archived path changed; verify provenance intent: {c}')

    print(f'Repository Standard v{deepget(cfg,"standard.version","?")} | mode={mode} | type={deepget(cfg,"repo.type","?")}')
    for x in warnings: print('WARN ',x)
    for x in errors: print('ERROR',x)
    print(f'\nResult: {len(errors)} error(s), {len(warnings)} warning(s)')
    if errors: return 1
    return 0
if __name__=='__main__': raise SystemExit(main())
