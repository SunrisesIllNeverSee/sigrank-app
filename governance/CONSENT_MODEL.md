---
type: Spec
title: Consent Model
description: Target consent model capturing enrollment consent with terms and privacy versions. Phase 1 defines the model; enforcement pending Phase 2.
tags: [sigrank, consent-model, enrollment, terms-version, privacy, spec]
timestamp: 2026-07-21
---

# Consent model

Consent should be captured at enrollment before routine submission collection begins. The record should include the timestamp, the accepted terms version, the accepted privacy version, the action or interface that captured consent, and the linked operator/account.

Consent versions are immutable historical facts: accepting a later version appends or updates a new acceptance record; it does not make an earlier consent appear to have covered new terms. Materially changed purposes require renewed, explicit consent.

Current Phase 1 status: this document defines the target model. The Phase 2 checklist specifies planned `operators` fields (`consented_at`, `terms_version`, `privacy_version`, `data_opt_out`, `data_opt_out_at`); do not assume they are enforced until the migration and application wiring land.