/**
 * lib/research/anonymize.ts — deterministic operator anonymization for the
 * State of the Index dataset.
 *
 * Maps any operator identifier (codename or display_name) to a stable
 * `signal#######` pseudonym using a SHA-256 hash truncated to 10 hex chars.
 * The same operator always gets the same signal ID across tables + rebuilds,
 * but the mapping cannot be reversed without the original codename.
 *
 * Format: `signal-<10 hex chars>` (matches the existing retired-operator
 * convention, e.g. `signal-92b4f9f485`).
 */

import { createHash } from "crypto";

/**
 * Deterministically map an operator identifier to a `signal-##########` pseudonym.
 * Uses SHA-256 of the input, truncated to the first 10 hex characters.
 */
export function signalId(identifier: string): string {
  const hash = createHash("sha256").update(identifier).digest("hex");
  return `signal-${hash.slice(0, 10)}`;
}
