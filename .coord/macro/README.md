# Macro Coordination

This directory carries **cross-repo build execution state**. It is not an organization catalog.

- `LINK.yaml` identifies this repo's role in a multi-system build and optionally points to a shared hub.
- `MACRO_STATE.md` records obligations, dependencies, blockers, and handoffs involving other systems.

A standalone repo can leave the link in `standalone` mode until a larger build begins.

## Hub bootstrap

For a build spanning multiple repos:

```bash
bash .coord/bin/macro-init-hub.sh BUILD_ID /shared/path/build-hub
bash .coord/bin/macro-link.sh BUILD_ID THIS_SYSTEM participant /shared/path/build-hub
bash .coord/bin/macro-register.sh /shared/path/build-hub THIS_SYSTEM "$PWD" participant
```

The hub contains only build-scoped state (`HUB.yaml`, `SYSTEMS.tsv`, `MACRO_BUS.md`, `MACRO_STATE.md`, `handoffs/`). Retire it with the build; promote durable relationships separately into the organization catalog.
