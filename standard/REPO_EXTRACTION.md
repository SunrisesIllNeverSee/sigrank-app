# Incubate Inside SigRank, Extract Later

## Now

Keep this directory at:

`sigrank-app/standard/`

This keeps the draft beside the public reference implementation while terminology and canon are being reconciled.

## Later

When ready to create a standalone repository:

1. move the contents of `standard/` to the root of `sigrank-standard`;
2. preserve Git history if desired with `git subtree split` or filter-repo;
3. update canonical URLs;
4. update SignalAF `/standard` to link to the standalone repository;
5. update `sigrank-mcp` and `@sigrank/cascade` READMEs;
6. retain SignalAF as reference implementation, not standards authority by accident;
7. add formal license / trademark policy only after deliberate decision.

## Suggested final standalone tree

```text
sigrank-standard/
├── README.md
├── SPEC.md
├── GLOSSARY.md
├── PRIVACY.md
├── CONFORMANCE.md
├── LIMITATIONS.md
├── GOVERNANCE.md
├── CANON_RECONCILIATION.md
├── schema/
├── examples/
├── reference/
├── rfc/
└── CHANGELOG.md
```
