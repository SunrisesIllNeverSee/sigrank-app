#!/bin/bash
set +e
payload="$(cat)"
script_dir="$(cd "$(dirname "$0")" && pwd)"
state="$(cd "$script_dir/../.." && pwd)/state"
mkdir -p "$state"
sid="$(python3 -c 'import json,sys;
try: print(json.load(sys.stdin).get("session_id", ""))
except Exception: print("")' <<< "$payload" 2>/dev/null)"
[ -n "$sid" ] || sid="session-$(date -u +%Y%m%d%H%M%S)-$$"
printf '%s\n' "$sid" > "$state/.session-current"
exit 0
