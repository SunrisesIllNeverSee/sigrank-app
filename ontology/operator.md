# Operator

An operator is the account-level subject associated with AI-work telemetry in SignalAF. It is not necessarily a legal person, employer, or unique human: one operator can have devices, submissions, and an optional authenticated account link.

An authenticated user resolves to an operator through `operator_accounts`. The board display rule prefers an available display name, otherwise a codename; direct identity is not appropriate for research releases. A profile can exist before it is claimed.

Sources: `lib/supabase/auth-server.ts`, `lib/compare/operator-name.ts`.