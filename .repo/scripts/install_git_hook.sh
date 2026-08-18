#!/bin/bash
set -euo pipefail
root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$root" ] || { echo "not inside a git repository" >&2; exit 1; }
mkdir -p "$root/.git/hooks"
cp "$root/.repo/git-hooks/pre-commit" "$root/.git/hooks/pre-commit"
chmod +x "$root/.git/hooks/pre-commit"
echo "Installed Repository Standard pre-commit hook."
