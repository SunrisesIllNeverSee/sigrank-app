# Integrated preview verification — October 11, 2026

Current application checkpoint: 766c6f0, branch integration/site-a315435, based on a315435.

The application is assembled and served at http://127.0.0.1:3230/. This supersedes the earlier audit-only state.

TypeScript, canonical 11/11, unit suite 682 passed/4 skipped/0 failed, UI suite 155/155, scoped lint, and production build passed. Nine principal routes returned HTTP 200.

Browser verification covered root leaderboard, workflow filters, Raw/Metrics, ascending sorting, same-site SigRank navigation, page contents and Articles topics, all six public profile panels, visitor-locked Report, Hall rendering and Hall-to-Compare navigation.

Open release gates: React hydration warning #418 on board/editorial flow; xoxo rank #0; authenticated owner/privacy review; profile watch count and unwired hero; uniform editorial format; final owner Hall/Compare design acceptance; inherited CI hygiene failure. Browser interaction checks are not release or full privacy approval.

INTEGRATION_RECEIPT.json records application SHA, route results, validation counts and source preservation. All 39 original source hashes and the full dirty Git status matched the original audit after integration. Candidate origin/hashes are in CANDIDATE_IMPORT_RECEIPT.json.

Independent dependencies, Node 22.23.3, ignored local environment and a successful unmodified-font production build are used. Original :3210/:3222 servers and sources remain unchanged. No merge, deployment, remote push or database mutation occurred.

See INTEGRATION_MANIFEST.md for paths, ownership boundaries, commits and the next-step checklist.
