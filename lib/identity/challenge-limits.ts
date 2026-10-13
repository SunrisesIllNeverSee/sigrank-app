import { NextResponse } from "next/server";
import { challengesEnabled } from "@/lib/features";

/** 404 returned by every challenge handler while the feature is muted. */
export function challengesMutedResponse(): NextResponse | null {
  if (challengesEnabled()) return null;
  return NextResponse.json(
    { error: "Not found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

/** Input caps shared by the challenge create + submit routes. */
export const MAX_PROMPT_BRIEF_CHARS = 2000;
export const MAX_SIGNAL_TEXT_CHARS = 2000;
export const MAX_CERT_JSON_BYTES = 16 * 1024;
export const MIN_WINDOW_HOURS = 1;
export const MAX_WINDOW_HOURS = 168;

export function isValidWindowHours(v: unknown): v is number {
  return (
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= MIN_WINDOW_HOURS &&
    v <= MAX_WINDOW_HOURS
  );
}

/** Serialized size check for an arbitrary JSON value. */
export function jsonWithinBytes(v: unknown, maxBytes: number): boolean {
  try {
    const s = JSON.stringify(v);
    return s === undefined || Buffer.byteLength(s, "utf8") <= maxBytes;
  } catch {
    return false;
  }
}
