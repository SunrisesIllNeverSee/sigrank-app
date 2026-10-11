# Final page promotion gates

- [ ] The current exact design/page is explicitly approved by owner.
- [ ] Source is tracked and checkpointed as an isolated reviewed commit or PR; critical new files are NOT left untracked.
- [ ] The workstream's diff does not include another agent's unreviewed edits.
- [ ] TypeScript, scoped ESLint, regression/canonical tests and production build pass on the exact candidate commit.
- [ ] Desktop and mobile visual comparison; keyboard, focus, missing/empty/loading/error states pass.
- [ ] Metrics/provenance, legal/SEO, consent, and owner/private gates pass where applicable.
- [ ] GitHub PR #239 CI hygiene failure resolved: 40 tracked files match the _workspace/ ignore rule. Do not untrack without reviewing preserved assets and owner authority.
- [ ] Open PR and CI states examined, no blocking issues; merge target/rollback strategy identified.
- [ ] Owner explicitly authorizes any merge/deploy.
- [ ] Post-deploy URL, commit SHA, timestamp, owner gate and health validation recorded.

No page is release-ready yet. No Git clean, stash pop, reset, forced checkout, DB write, schema migration, PR merge or production deployment by implication.
