/**
 * app/openapi.json/route.ts — OpenAPI document with MPP payment discovery.
 *
 * Serves an OpenAPI 3.0 document at the site root with x-payment-info
 * extensions on payable operations so AI agents can discover payable
 * endpoints via the Machine Payment Protocol (MPP).
 * Spec: https://paymentauth.org/draft-payment-discovery-00.txt
 */

import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "SigRank SignalAF API",
      version: "1.0.0",
      description:
        "Public API for AI operator leaderboard data. Read endpoints are free; premium endpoints require payment via x402 or MPP. Privacy-preserving: token counts only, never prompts.",
      contact: {
        name: "SigRank SignalAF",
        url: SITE_ORIGIN,
      },
    },
    servers: [
      {
        url: `${SITE_ORIGIN}/api/v1`,
        description: "Production",
      },
    ],
    "x-service-info": {
      name: "SigRank SignalAF",
      categories: ["ai-benchmarking", "operator-scoring", "token-efficiency", "developer-tools"],
      description:
        "SigRank SignalAF ranks AI operators by Yield (Υ) — token-cascade efficiency. Privacy-preserving: token counts only, never prompts.",
      url: SITE_ORIGIN,
    },
    paths: {
      "/leaderboard": {
        get: {
          summary: "Get the operator leaderboard",
          description:
            "Get the current top-N AI operator rankings by Yield (Υ) with optional window/platform/limit filters.",
          operationId: "getLeaderboard",
          tags: ["leaderboard"],
          parameters: [
            {
              name: "window",
              in: "query",
              schema: { type: "string", enum: ["7d", "30d", "90d", "all_time"] },
              description: "Time window for rankings",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 25, maximum: 2000 },
              description: "Number of operators to return",
            },
            {
              name: "platform",
              in: "query",
              schema: { type: "string" },
              description: "Filter by platform (e.g. claude, cursor, copilot)",
            },
          ],
          responses: {
            "200": {
              description: "Leaderboard data",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Leaderboard" },
                },
              },
            },
          },
        },
      },
      "/operators/{codename}": {
        get: {
          summary: "Get a single operator's profile",
          description:
            "Get a single operator's full profile, metrics, and rank.",
          operationId: "getOperator",
          tags: ["operators"],
          parameters: [
            {
              name: "codename",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Operator codename",
            },
          ],
          responses: {
            "200": {
              description: "Operator profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Operator" },
                },
              },
            },
          },
        },
      },
      "/operators/{codename}/history": {
        get: {
          summary: "Get an operator's rank history",
          description: "Get an operator's rank history over time.",
          operationId: "getOperatorHistory",
          tags: ["operators"],
          parameters: [
            {
              name: "codename",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Rank history",
              content: {
                "application/json": {
                  schema: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
      },
      "/metrics": {
        get: {
          summary: "Get metric definitions",
          description:
            "Get definitions and formulas for all SigRank metrics (Yield, SNR, Leverage, Velocity, 10xDEV).",
          operationId: "getMetrics",
          tags: ["metrics"],
          responses: {
            "200": {
              description: "Metric definitions",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      "/hall-of-signal": {
        get: {
          summary: "Get all-time records and badge holders",
          description: "Get all-time records and badge holders.",
          operationId: "getHallOfSignal",
          tags: ["hall"],
          responses: {
            "200": {
              description: "Hall of Signal data",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      "/snapshots": {
        post: {
          summary: "Submit a token telemetry snapshot",
          description:
            "Submit a new token telemetry snapshot for operator scoring. Requires authentication.",
          operationId: "submitSnapshot",
          tags: ["submissions"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Snapshot" },
              },
            },
          },
          responses: {
            "200": {
              description: "Snapshot accepted",
            },
            "401": {
              description: "Authentication required",
            },
          },
        },
      },
      "/premium/insights": {
        get: {
          summary: "Get premium operator insights (payable)",
          description:
            "Get deep-dive analytics including cascade analysis, archetype distribution, and efficiency projections. Requires payment via x402 protocol.",
          operationId: "getPremiumInsights",
          tags: ["premium"],
          "x-payment-info": {
            intent: "charge",
            method: "tempo",
            amount: "0.01",
            currency: "USDC",
            description: "Premium operator insights — cascade analysis, archetype distribution, and efficiency projections",
          },
          responses: {
            "200": {
              description: "Premium insights data",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
            "402": {
              description: "Payment required — x402 payment requirements in response",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      "/premium/cascade-report": {
        get: {
          summary: "Get premium cascade analysis report (payable)",
          description:
            "Get a full token-cascade analysis report for a specific operator, including bottleneck identification and optimization recommendations.",
          operationId: "getCascadeReport",
          tags: ["premium"],
          parameters: [
            {
              name: "codename",
              in: "query",
              required: true,
              schema: { type: "string" },
              description: "Operator codename to analyze",
            },
          ],
          "x-payment-info": {
            intent: "charge",
            method: "tempo",
            amount: "0.05",
            currency: "USDC",
            description: "Full cascade analysis report with bottleneck identification and optimization recommendations",
          },
          responses: {
            "200": {
              description: "Cascade analysis report",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
            "402": {
              description: "Payment required",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
      schemas: {
        Leaderboard: {
          type: "object",
          properties: {
            window: { type: "string" },
            entries: {
              type: "array",
              items: { $ref: "#/components/schemas/LeaderboardEntry" },
            },
          },
        },
        LeaderboardEntry: {
          type: "object",
          properties: {
            codename: { type: "string" },
            rank: { type: "integer" },
            yield: { type: "number" },
            leverage: { type: "number" },
            velocity: { type: "number" },
          },
        },
        Operator: {
          type: "object",
          properties: {
            codename: { type: "string" },
            yield: { type: "number" },
            rank: { type: "integer" },
            class_tier: { type: "string" },
            archetype: { type: "string" },
          },
        },
        Snapshot: {
          type: "object",
          properties: {
            codename: { type: "string" },
            input: { type: "number" },
            output: { type: "number" },
            cache_read: { type: "number" },
            cache_write: { type: "number" },
          },
        },
      },
    },
  };

  return new NextResponse(JSON.stringify(spec, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
