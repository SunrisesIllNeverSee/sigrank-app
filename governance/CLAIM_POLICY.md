---
type: Spec
title: Claim Policy
description: Rules for claiming unclaimed profiles via authenticated proof of operator identity. Claims are auditable and reversible. Active.
tags: [sigrank, claim-policy, profile-claim, authentication, provenance, spec]
timestamp: 2026-07-21
---

# Claim policy

An unclaimed profile can be claimed only by proving control of the relevant operator identity through the product's authenticated claim flow. A claim links a verified user to an operator; it does not erase provenance or convert external observations into self-reported facts.

Claims must be auditable, resistant to duplicate ownership, and reversible through support review where account compromise or mistaken linkage is credibly reported. Display name changes follow the canonical display rule, while research releases remain anonymized.

Source basis: `lib/supabase/auth-server.ts`, which resolves a verified Supabase user to `operator_accounts`.