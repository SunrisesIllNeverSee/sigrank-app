# Shared redesign staging workflow

## Canonical working location

- Folder: /Users/dericmchenry/Developer/active/SigRank-repos/signalaf-integration-a315435
- Convenient folder link: /Users/dericmchenry/Developer/active/SigRank-repos/SIGNALAF-Website-Redesign/01-Staged-Website
- Branch: integration/site-a315435
- GitHub repository: SunrisesIllNeverSee/sigrank-app
- Local working preview: http://127.0.0.1:3230/
- The standalone :8791 HTML design mock and the historical :3210/:3222 previews are not this integrated website.

## Every workstream handoff

1. Verify the checkout and branch before editing. State the files you own. Coordinate shared shell/CSS edits; do not commit another agent's unfinished changes.
2. Complete and verify the scoped work. Record page routes and outstanding acceptance gates in release-staging.
3. Commit only owned files. TypeScript and canonical tests must pass before every commit; run relevant feature checks too.
4. Push integration/site-a315435. A local commit is not a completed remote handoff. If remote changed, inspect divergence and integrate without discarding work or force-pushing.
5. Supply exact commit, changed routes, checks and GitHub push result. Integration reviewer verifies the whole affected site, not only the homepage.
6. Verify Vercel preview for that same commit. Pending, failed or older preview is not synchronized. The local development server serves current disk contents, including unfinished edits; a remote preview serves a committed build. Label which one is being reviewed.
7. End a staging checkpoint with no unexplained dirty files and identical local/remote integration commits. Active edits remain explicitly work in progress until their scoped commit lands.

## Production boundary

The owner clarified that staging should stay synchronized while the public site is left unchanged during redesign. Pushes to the integration branch and preview builds are allowed. Do not merge into main, promote a preview, or deploy production as part of a staging handoff.

## Application checkpoint

196bb34 includes the latest Compare implementation along with the homepage, editorial, Hall, profile and shared rail work. TypeScript, 11 canonical tests, and 17 Compare tests passed before synchronization. Whole-site browser synchronization checks cover homepage, Compare, five writing indexes, Hall and Profile; they do not replace final design/privacy/owner acceptance gates.
