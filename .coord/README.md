# Coordination Layer

Two coupled operational systems:

- `micro/` — coordination inside this repo/build lane.
- `macro/` — coordination across repositories/systems during a larger build.

The macro layer is not the organization catalog.

## Handoff orientation

When picking up a handoff in this repo, use Repomix MCP to pack the codebase
and grep for key patterns (function names, formulas, config) to orient
yourself quickly instead of reading files one by one. See AGENTS.md for
library lookup guidance (Context7).
