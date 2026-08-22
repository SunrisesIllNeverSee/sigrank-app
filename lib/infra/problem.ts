import "server-only";

import { NextResponse } from "next/server";

export interface ProblemOptions {
  status: number;
  title: string;
  detail: string;
  code: string;
  hint?: string;
  type?: string;
  instance?: string;
  headers?: HeadersInit;
}

/**
 * RFC 9457 Problem Details response with stable machine-readable extensions.
 * `code` is for programmatic branching; `hint` tells an agent how to recover.
 */
export function problemResponse(options: ProblemOptions): NextResponse {
  const {
    status,
    title,
    detail,
    code,
    hint,
    type = "about:blank",
    instance,
    headers,
  } = options;

  return NextResponse.json(
    {
      type,
      title,
      status,
      detail,
      ...(instance ? { instance } : {}),
      code,
      message: detail,
      ...(hint ? { hint } : {}),
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json; charset=utf-8",
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}
