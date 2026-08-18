# Repository Governance Layer

`.repo/` contains the implementation of the repository standard.

- `profiles/` defines allowed root structures by repo type.
- `scripts/repo_check.py` is the canonical validator.
- `scripts/repo_doctor.py` reports local prerequisites/state.
- `git-hooks/pre-commit` provides optional local enforcement.
- `MIGRATION_MAP.md` is the operator-owned plan for reorganizing an existing repo.

Do not put product/research content in `.repo/`.
