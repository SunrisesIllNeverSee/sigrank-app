---
type: Spec
title: OKF — Object-Knowledge Format v1.0
description: Metadata convention for active Markdown knowledge objects and coordination documents.
tags: [repo-standard, coordination, okf]
timestamp: 2026-08-18
---


# Object-Knowledge Format

Every governed Markdown knowledge object should begin with YAML frontmatter containing:

```yaml
---
type: Design|Brief|Spec|Reference|Analysis|Runbook|Coordination|Roadmap|Findings|Index|Handoff|State
title: Human-readable title
description: What the document is and its current status
tags: [repo-tag, relevant-tag]
timestamp: YYYY-MM-DD
---
```

`last_touched:` may be added automatically by the edit hook. README files are exempt from strict OKF linting.
