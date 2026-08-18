from pathlib import Path
import json, re

TRUE={'true','yes','on'}; FALSE={'false','no','off'}

def scalar(v):
    v=v.strip()
    if not v: return None
    if v.startswith('[') and v.endswith(']'):
        inner=v[1:-1].strip()
        if not inner: return []
        return [scalar(x) for x in re.split(r'\s*,\s*', inner)]
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    low=v.lower()
    if low in TRUE: return True
    if low in FALSE: return False
    if low in {'null','~'}: return None
    if re.fullmatch(r'-?\d+',v): return int(v)
    return v

def load_simple_yaml(path):
    lines=Path(path).read_text(encoding='utf-8').splitlines()
    root={}; stack=[(-1,root)]
    for raw in lines:
        if not raw.strip() or raw.lstrip().startswith('#'): continue
        indent=len(raw)-len(raw.lstrip(' ')); line=raw.strip()
        if ':' not in line: continue
        key,val=line.split(':',1); key=key.strip(); val=val.strip()
        while stack and indent<=stack[-1][0]: stack.pop()
        parent=stack[-1][1]
        if val=='':
            obj={}; parent[key]=obj; stack.append((indent,obj))
        else: parent[key]=scalar(val)
    return root

def deepget(d, path, default=None):
    cur=d
    for part in path.split('.'):
        if not isinstance(cur,dict) or part not in cur: return default
        cur=cur[part]
    return cur

def repo_root(start=None):
    p=Path(start or '.').resolve()
    for q in [p,*p.parents]:
        if (q/'REPO.yaml').exists() or (q/'.git').exists(): return q
    return p

def config(root):
    p=root/'REPO.yaml'
    if not p.exists(): return {}
    return load_simple_yaml(p)

def profile(root,cfg):
    typ=deepget(cfg,'structure.profile') or deepget(cfg,'repo.type') or 'product'
    p=root/'.repo'/'profiles'/f'{typ}.json'
    if not p.exists(): raise FileNotFoundError(f'profile not found: {p}')
    return json.loads(p.read_text())
