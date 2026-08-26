#!/bin/bash
set +e
payload="$(cat)"
script_dir="$(cd "$(dirname "$0")" && pwd)"
micro="$(cd "$script_dir/../.." && pwd)"
repo="$(cd "$micro/../.." && pwd)"
state="$micro/state"; mkdir -p "$state"
readarray -t parsed < <(python3 -c 'import json,sys
try:
 d=json.load(sys.stdin); ti=d.get("tool_input") or {}; tr=d.get("tool_response") or {}
 print(ti.get("file_path") or tr.get("filePath") or "")
 print(d.get("session_id") or "")
except Exception:
 print(""); print("")' <<< "$payload" 2>/dev/null)
f="${parsed[0]:-}"; sid="${parsed[1]:-}"
[ -n "$f" ] || exit 0
case "$f" in /*) ;; *) f="$repo/$f";; esac
[ -f "$f" ] || exit 0
case "$f" in "$repo"/*) ;; *) exit 0;; esac
case "$f" in *.md) ;; *) exit 0;; esac
now="$(date -u '+%Y-%m-%d %H:%M UTC')"; role=UNKNOWN
[ -z "$sid" ] && [ -f "$state/.session-current" ] && sid="$(cat "$state/.session-current")"
[ -n "$sid" ] && [ -f "$state/.role-$sid" ] && role="$(cat "$state/.role-$sid")"
rel="${f#$repo/}"; printf '%s · %s · edited %s\n' "$now" "$role" "$rel" >> "$state/ACTIVITY.log"
[ "$(head -1 "$f")" = '---' ] || exit 0
python3 - "$f" "$now" <<'PY2'
from pathlib import Path
import sys,re
p=Path(sys.argv[1]); now=sys.argv[2]; s=p.read_text(); parts=s.split('---',2)
if len(parts)<3: raise SystemExit
fm=parts[1]
if re.search(r'(?m)^last_touched:',fm): fm=re.sub(r'(?m)^last_touched:.*$',f'last_touched: {now}',fm)
else: fm=fm.rstrip()+f'\nlast_touched: {now}\n'
p.write_text('---'+fm+'---'+parts[2])
PY2
exit 0
