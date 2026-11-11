#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand).
# Exit 0 = skip the build. Exit 1 = run the build.
#
# Production (main): build only when site files changed, as before.
# Preview (every other branch): skip by default to cut build cost. Put
# [preview] in the commit message to get a preview link for that push.
# The "does it still build" check for every PR runs in GitHub CI instead
# (.github/workflows/ci.yml, job "next build").
set -u

if [ "${VERCEL_ENV:-}" = "production" ]; then
  if git diff --quiet HEAD^ HEAD -- app components lib public package.json package-lock.json next.config.ts vercel.json supabase scripts content; then
    echo "No site files changed: skipping production build"
    exit 0
  fi
  # Files changed, or git could not tell: build.
  exit 1
fi

case "${VERCEL_GIT_COMMIT_MESSAGE:-}" in
  *"[preview]"*)
    echo "[preview] in commit message: building preview"
    exit 1
    ;;
esac

echo "Skipping preview build. Add [preview] to the commit message to build one."
exit 0
