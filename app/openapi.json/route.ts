import { NextResponse } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const revalidate = 3600;

const problemContent = {
  "application/problem+json": {
    schema: { $ref: "#/components/schemas/Problem" },
  },
};

const commonErrors = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "429": { $ref: "#/components/responses/RateLimited" },
  "500": { $ref: "#/components/responses/InternalError" },
};

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "SigRank SignalAF API",
      version: "1.0.0",
      description:
        "Versioned public API for AI operator benchmark data. Read endpoints are public unless stated otherwise. Errors use RFC 9457 Problem Details.",
      contact: {
        name: "SigRank SignalAF",
        url: `${SITE_ORIGIN}/contact`,
      },
      "x-deprecation-policy": `${SITE_ORIGIN}/developers#versioning`,
    },
    externalDocs: {
      description: "SignalAF Developer Portal",
      url: `${SITE_ORIGIN}/developers`,
    },
    servers: [
      {
        url: `${SITE_ORIGIN}/api/v1`,
        description: "Production API v1",
      },
    ],
    "x-service-info": {
      name: "SigRank SignalAF",
      categories: ["ai-benchmarking", "operator-scoring", "token-efficiency", "developer-tools"],
      description:
        "Ranks AI operators by token-cascade efficiency using privacy-preserving token telemetry.",
      url: SITE_ORIGIN,
      docs: `${SITE_ORIGIN}/developers`,
      mcp: `${SITE_ORIGIN}/.well-known/mcp.json`,
      cli: "npx sigrank",
    },
    paths: {
      "/leaderboard": {
        get: {
          summary: "Get the operator leaderboard",
          description:
            "Get current AI-operator rankings by Yield with optional window, platform, and limit filters. Rate-limit state is returned in RateLimit headers.",
          operationId: "getLeaderboard",
          tags: ["leaderboard"],
          parameters: [
            {
              name: "window",
              in: "query",
              description: "Time window for leaderboard rankings: 7d, 30d, 90d, or all_time.",
              schema: { type: "string", enum: ["7d", "30d", "90d", "all_time"] },
            },
            {
              name: "limit",
              in: "query",
              description: "Maximum number of operators to return (1–2000, default 25).",
              schema: { type: "integer", default: 25, minimum: 1, maximum: 2000 },
            },
            { name: "platform", in: "query", description: "Filter by AI platform (e.g. claude, chatgpt).", schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "Leaderboard data",
              headers: {
                "RateLimit-Policy": { schema: { type: "string" } },
                RateLimit: { schema: { type: "string" } },
              },
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Leaderboard" } },
              },
            },
            ...commonErrors,
          },
        },
      },
      "/operators/{codename}": {
        get: {
          summary: "Get an operator profile",
          description:
            "Retrieve a public operator profile by codename, including class tier, global rank, percentile, Yield, Leverage, Velocity, and SNR. Rate-limit state is returned in RateLimit headers.",
          operationId: "getOperator",
          tags: ["operators"],
          parameters: [
            {
              name: "codename",
              in: "path",
              required: true,
              description: "The operator's unique codename (e.g. signal-ae3b5c3c55).",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Operator profile",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/Operator" } },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
            ...commonErrors,
          },
        },
      },
      "/operators/{codename}/history": {
        get: {
          summary: "Get operator rank history",
          description:
            "Retrieve longitudinal rank history for a single operator, showing rank movement over time across snapshot windows.",
          operationId: "getOperatorHistory",
          tags: ["operators"],
          parameters: [
            {
              name: "codename",
              in: "path",
              required: true,
              description: "The operator's unique codename (e.g. signal-ae3b5c3c55).",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Rank history",
              content: {
                "application/json": { schema: { type: "array", items: { type: "object" } } },
              },
            },
            "404": { $ref: "#/components/responses/NotFound" },
            ...commonErrors,
          },
        },
      },
      "/metrics": {
        get: {
          summary: "Get metric definitions",
          description:
            "Return canonical definitions for SigRank metrics: Yield, Leverage, Velocity, SNR, 10xDEV, and Construction. Use this to interpret metric values returned by other endpoints.",
          operationId: "getMetrics",
          tags: ["metrics"],
          responses: {
            "200": {
              description: "Metric definitions",
              content: { "application/json": { schema: { type: "object" } } },
            },
            ...commonErrors,
          },
        },
      },
      "/hall-of-signal": {
        get: {
          summary: "Get all-time records and badge holders",
          description:
            "Return all-time record holders and badge recipients across SigRank metrics. Includes category leaders and notable operator achievements.",
          operationId: "getHallOfSignal",
          tags: ["hall"],
          responses: {
            "200": {
              description: "Hall of Signal data",
              content: { "application/json": { schema: { type: "object" } } },
            },
            ...commonErrors,
          },
        },
      },
      "/snapshots": {
        post: {
          summary: "Submit a token telemetry snapshot",
          description: "Submit a signed token-telemetry snapshot. Requires user authentication.",
          operationId: "submitSnapshot",
          tags: ["submissions"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Snapshot" } },
            },
          },
          responses: {
            "200": { description: "Snapshot accepted" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "429": { $ref: "#/components/responses/RateLimited" },
            "500": { $ref: "#/components/responses/InternalError" },
          },
        },
      },
      "/premium/insights": {
        get: {
          summary: "Get premium operator insights",
          description:
            "Return premium operator insights including extended telemetry breakdowns and archetype analysis. Requires x402 USDC micropayment.",
          operationId: "getPremiumInsights",
          tags: ["premium"],
          "x-payment-info": {
            intent: "charge",
            method: "tempo",
            amount: "0.01",
            currency: "USDC",
          },
          responses: {
            "200": {
              description: "Premium insights data",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "402": {
              description: "Payment required",
              content: problemContent,
            },
            ...commonErrors,
          },
        },
      },
      "/premium/cascade-report": {
        get: {
          summary: "Get premium cascade analysis report",
          description:
            "Return a detailed token-cascade analysis report for a specific operator, including input/output/cache breakdowns and efficiency diagnostics. Requires x402 USDC micropayment.",
          operationId: "getCascadeReport",
          tags: ["premium"],
          parameters: [
            {
              name: "codename",
              in: "query",
              required: true,
              description: "The operator's unique codename to analyze.",
              schema: { type: "string" },
            },
          ],
          "x-payment-info": {
            intent: "charge",
            method: "tempo",
            amount: "0.05",
            currency: "USDC",
          },
          responses: {
            "200": {
              description: "Cascade report",
              content: { "application/json": { schema: { type: "object" } } },
            },
            "402": { description: "Payment required", content: problemContent },
            ...commonErrors,
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
      responses: {
        BadRequest: {
          description: "Invalid request",
          content: problemContent,
        },
        Unauthorized: {
          description: "Authentication required",
          content: problemContent,
        },
        NotFound: {
          description: "Resource not found",
          content: problemContent,
        },
        RateLimited: {
          description: "Rate limit exceeded",
          headers: {
            "Retry-After": { schema: { type: "integer" } },
            "RateLimit-Policy": { schema: { type: "string" } },
            RateLimit: { schema: { type: "string" } },
          },
          content: problemContent,
        },
        InternalError: {
          description: "Unexpected server error",
          content: problemContent,
        },
      },
      schemas: {
        Problem: {
          type: "object",
          required: ["type", "title", "status", "detail", "code", "message"],
          properties: {
            type: { type: "string", format: "uri-reference" },
            title: { type: "string" },
            status: { type: "integer", minimum: 400, maximum: 599 },
            detail: { type: "string" },
            instance: { type: "string", format: "uri-reference" },
            code: { type: "string", description: "Stable machine-readable error code." },
            message: { type: "string", description: "Human-readable error message." },
            hint: { type: "string", description: "Recovery guidance for agents and developers." },
          },
        },
        Leaderboard: {
          type: "object",
          properties: {
            window: { type: "string", description: "Time window used for rankings." },
            entries: {
              type: "array",
              description: "Ranked operator entries.",
              items: { $ref: "#/components/schemas/LeaderboardEntry" },
            },
          },
        },
        LeaderboardEntry: {
          type: "object",
          properties: {
            codename: { type: "string", description: "Operator's unique codename." },
            rank: { type: "integer", description: "Global rank position." },
            yield: { type: "number", description: "Yield (Υ) = (cache_read × output) / input²." },
            leverage: { type: "number", description: "Leverage = cache_read / input." },
            velocity: { type: "number", description: "Velocity = output / input." },
          },
        },
        Operator: {
          type: "object",
          properties: {
            codename: { type: "string", description: "Operator's unique codename." },
            yield: { type: "number", description: "Yield (Υ) cascade efficiency metric." },
            rank: { type: "integer", description: "Global rank position." },
            class_tier: { type: "string", description: "Operator class tier." },
            archetype: { type: "string", description: "Operator archetype (shape of operation)." },
          },
        },
        Snapshot: {
          type: "object",
          required: ["input", "output", "cache_read", "cache_write"],
          properties: {
            codename: { type: "string", description: "Operator's unique codename." },
            input: { type: "number", minimum: 0, description: "Total input tokens consumed." },
            output: { type: "number", minimum: 0, description: "Total output tokens generated." },
            cache_read: { type: "number", minimum: 0, description: "Tokens read from prompt cache." },
            cache_write: { type: "number", minimum: 0, description: "Tokens written to prompt cache." },
          },
        },
      },
    },
  };

  return new NextResponse(JSON.stringify(spec, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
