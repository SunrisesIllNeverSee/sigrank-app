#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand).
# Exit 0 = skip the build. Exit 1 = run the build.
#
# Preview (every branch but main): skip by default to cut build cost. Put
# [preview] in the commit message to get a preview link for that push.
# The "does it still build" check for PRs runs in GitHub CI instead
# (.github/workflows/ci.yml, job "next build").
#
# Everything else (production, or Vercel did not say): build when site files
# changed since the last deployed commit, as before. When in doubt, build.
set -u

if [ "${VERCEL_ENV:-}" = "preview" ] && [ "${VERCEL_GIT_COMMIT_REF:-}" != "main" ]; then
  case "${VERCEL_GIT_COMMIT_MESSAGE:-}" in
    *"[preview]"*)
      echo "[preview] in commit message: building preview"
      exit 1
      ;;
  esac
  echo "Skipping preview build. Add [preview] to the commit message to build one."
  exit 0
fi

# Compare against the last deployed commit when Vercel provides it, so a
# multi-commit push is judged on all its commits, not only the newest one.
base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
if git diff --quiet "$base" HEAD -- app components lib public package.json package-lock.json next.config.ts vercel.json supabase scripts content; then
  echo "No site files changed since $base: skipping build"
  exit 0
fi
# Files changed, or git could not tell (exit 128): build.
exit 1
