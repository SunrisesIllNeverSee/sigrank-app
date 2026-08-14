# SignalAF Live demo

`/live` is a single-screen, 90-second demonstration of the SignalAF thesis:

```text
HUMAN × CONTEXT × MODEL
```

It has two operating modes:

- **Simulated** — a deterministic two-model run with a complete narrative arc.
- **Live input** — polls `/api/live` for token-pillar snapshots. A model-name
  change automatically opens the comparison scene.

## Run locally

Use the repository's normal development command and open the live route:

```bash
npm install
npm run dev
open http://localhost:3000/live
```

The simulated experience needs no environment variables or backend services.
Select **Run 90s demo** to play it at presentation speed. Use **4× speed** for
rehearsal, **Next scene** to jump between beats, or the keyboard controls:

```text
Space          play / pause
R              reset
Left / Right   move eight seconds
```

## Send live telemetry

Localhost accepts snapshots without a token. Select **Live input** in the UI,
then post a four-pillar snapshot:

```bash
curl -X POST http://localhost:3000/api/live \
  -H 'content-type: application/json' \
  --data '{
    "operator": "MOSSES",
    "model": "CLAUDE SONNET 4.5",
    "context": "SIGRANK / LIVE INSTRUMENT",
    "input": 18000,
    "output": 31000,
    "cacheCreate": 180000,
    "cacheRead": 4200000
  }'
```

Post another snapshot with a different `model` to trigger the comparison:

```bash
curl -X POST http://localhost:3000/api/live \
  -H 'content-type: application/json' \
  --data '{
    "operator": "MOSSES",
    "model": "CODEX",
    "context": "SIGRANK / LIVE INSTRUMENT",
    "input": 28000,
    "output": 36000,
    "cacheCreate": 300000,
    "cacheRead": 2550000
  }'
```

The endpoint intentionally accepts aggregate token counts and display labels
only. It does not accept prompt text, transcripts, source code, or tool output.

## Deploy

The route deploys with the existing app: merge to `main` and let Vercel build
the project. Add `SIGNALAF_LIVE_TOKEN` in the deployment environment before
using live input outside localhost, then send:

```bash
curl -X POST https://signalaf.com/api/live \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $SIGNALAF_LIVE_TOKEN" \
  --data '{ ... }'
```

The current live bridge is deliberately minimal and keeps the most recent
snapshot in process memory. That is reliable for a local or single-instance
demo. A multi-instance production deployment needs a shared realtime channel
(for example Supabase Realtime) so the writer and viewer always see the same
instance. Simulated mode is fully deployment-safe and has no such dependency.

## Metric integrity

All visible cascade diagnostics use the existing client-safe
`computeCascadeMetrics()` implementation. Archetype classification uses the
existing ten-type classifier. Field position is calculated against the current
`public/data/field-analysis.json` distribution at render time.

The final `94.2%` operator-identification scene is labeled **prototype shape
match**. It is a narrative prototype, not a canonical SigRank score or a claim
that an identity model is already deployed.
