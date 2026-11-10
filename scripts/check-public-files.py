#!/usr/bin/env python3
"""Reject private operating files and references in public source."""
from pathlib import PurePosixPath
import re
import subprocess
import sys

DIRS = {'.coord', '.repo', '.ello', '.devin', '.agents', '.claude', 'system-devin', 'Devins_Plans', 'release-staging', '_workspace'}
FILES = {'AGENTS.md', 'CLAUDE.md', 'REPO.yaml', 'skills-lock.json'}
PREFIXES = ('docs/superpowers/', 'standard/strategy/')
PATHS = {'docs/LIVE_BOARD_SESSION_HANDOFF.md'}
TEXT = re.compile(rb'(?:/Users/[^/\s]+/Developer/|Developer/_control/|Developer/active/SigRank-repos|sigrank-coordination|\bDrep[12]\b)', re.I)
SELF = 'scripts/check-public-files.py'

def private_path(path):
    parts = PurePosixPath(path).parts
    return bool(set(parts[:-1]) & DIRS or (parts and parts[-1] in FILES) or path in PATHS or path.startswith(PREFIXES))

def git(*args):
    return subprocess.check_output(['git', *args])

def main():
    if '--self-test' in sys.argv:
        for path in ['AGENTS.md', '.ello/identity.yaml', '.coord/state.md', 'nested/.devin/hooks.json', 'docs/superpowers/plans/task.md']:
            assert private_path(path), path
        for path in ['app/agents.md/route.ts', 'src/agent.mjs', '.github/workflows/ci.yml', 'standard/SPEC.md']:
            assert not private_path(path), path
        assert TEXT.search(b'/Users/example/Developer/project')
        assert not TEXT.search(b'const home = os.homedir();')
        print('Public-file boundary tests passed')
        return 0
    problems = []
    for path in filter(None, git('ls-files', '-z').decode().split('\0')):
        if private_path(path):
            problems.append(path + ': private operating file')
        elif path != SELF:
            data = git('show', ':' + path)
            if b'\0' not in data and TEXT.search(data):
                problems.append(path + ': private operating reference')
    if '--history' in sys.argv:
        names = git('log', '--all', '--format=', '--name-only', '--diff-filter=AM').decode().splitlines()
        for path in sorted(set(names)):
            if private_path(path):
                problems.append(path + ': private file in reachable history')
    if problems:
        print('\n'.join(problems), file=sys.stderr)
        return 1
    print('Public-file hygiene passed')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
