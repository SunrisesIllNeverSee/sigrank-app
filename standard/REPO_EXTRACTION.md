# Legacy Standard Extraction Status

The extraction described by the original incubation plan has already occurred.

Current authority state:

```text
sigrank-app/standard/          historical compatibility snapshot
        ↓
sigrank-standard              standalone legacy predecessor
        ↓
TTEOP / tteop-spec            sole current protocol authority
```

## Why this directory remains

Keep `sigrank-app/standard/` only while SignalAF needs the frozen
`sigrank/0.1-draft` schema and fixture pack for backward-compatibility tests.

It MUST NOT:

- define current protocol semantics;
- compete with TTEOP as a standards authority;
- receive new normative metric changes;
- be cited as the primary conformance target.

Current protocol changes belong in TTEOP / `tteop-spec`. SignalAF's implementation contract is documented in `TTEOP-IMPLEMENTATION-PROFILE.md`.

## Eventual removal

The embedded snapshot may be removed once legacy `sigrank/0.1-draft`
compatibility is no longer required and all remaining consumers have migrated.
