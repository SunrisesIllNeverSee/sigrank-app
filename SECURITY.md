# Security Policy

SigRank handles billing flows, service-role database access, and proprietary
scoring configuration. Please report security issues privately and avoid filing
public issues for vulnerabilities.

## Supported Versions

Security fixes target the `main` branch.

## Reporting a Vulnerability

Email the maintainer or open a private GitHub security advisory for this
repository. Include:

- A clear description of the issue.
- Steps to reproduce or a proof of concept.
- The affected route, component, or configuration.
- Any evidence of exposed secrets, data access, or billing impact.

Please do not include real secrets, customer data, or private tokens in reports.

## Secret Handling

- Never commit `.env.local`, Supabase service-role keys, Stripe keys, webhook
  secrets, or production ruleset values.
- Store production secrets in Vercel environment variables.
- Treat `SIGRANK_RULESET` and all RS.xx scoring parameters as server-only.
- Do not expose service-role Supabase clients to browser code.

## Deployment Expectations

- Keep Row Level Security enabled in Supabase.
- Use a dedicated Supabase project for SigRank.
- Verify Stripe webhooks with `STRIPE_WEBHOOK_SECRET`.
- Run typecheck, canonical ingest tests, and production build before release.
