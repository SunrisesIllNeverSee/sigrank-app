import type { NextRequest } from "next/server";
import { problemResponse } from "@/lib/infra/problem";
import { rateLimit, rateLimitHeaders } from "@/lib/infra/api-gate";

function notFound(req: NextRequest) {
  const rl = rateLimit(req);
  return problemResponse({
    status: 404,
    title: "API endpoint not found",
    detail: `No SignalAF API endpoint exists at ${req.nextUrl.pathname}.`,
    code: "endpoint_not_found",
    hint: "Inspect https://signalaf.com/openapi.json or https://signalaf.com/developers for supported endpoints.",
    type: "https://signalaf.com/developers#errors",
    instance: req.nextUrl.pathname,
    headers: rateLimitHeaders(rl),
  });
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const OPTIONS = notFound;
