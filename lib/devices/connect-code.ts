import 'server-only'

/**
 * lib/devices/connect-code.ts — connect-code generation + normalization (D7 §4.2).
 *
 * Format: SIGR-XXXXX-XXXXX-XXXXX — three groups of 5 Crockford base32 chars =
 * 15 chars × 5 bits = ~75 bits of entropy (≥60-bit floor per §0.3). The Crockford
 * alphabet omits I L O U to avoid transcription errors; generation never emits
 * them, and normalization folds a hand-typed I/L→1, O→0 so a paste/typo still
 * matches the stored PK. crypto.randomBytes for entropy; 256 % 32 == 0, so the
 * `byte % 32` index draw is unbiased.
 */

import { randomBytes } from 'node:crypto'

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' // 32 chars, no I L O U

/** Generate a fresh SIGR-XXXXX-XXXXX-XXXXX connect code (~75-bit). */
export function generateConnectCode(): string {
  const bytes = randomBytes(15)
  let s = ''
  for (let i = 0; i < 15; i++) s += CROCKFORD[bytes[i] % 32]
  return `SIGR-${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}`
}

/**
 * Normalize a user-pasted/typed code to the canonical stored form: uppercase,
 * whitespace stripped, and (in the code BODY only — never the SIGR prefix)
 * Crockford-fold I/L→1 and O→0. A non-SIGR input is returned uppercased so the DB
 * lookup simply misses (→ code_invalid), never throwing.
 */
export function normalizeConnectCode(raw: string): string {
  const up = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!up.startsWith('SIGR-')) return up
  const body = up.slice(5).replace(/[ILO]/g, (c) => (c === 'O' ? '0' : '1'))
  return `SIGR-${body}`
}
