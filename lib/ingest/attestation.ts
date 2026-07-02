import 'server-only'

/**
 * lib/ingest/attestation.ts — S1.3 source file integrity attestation (server side).
 *
 * When a v1.1 payload includes a `source_attestation` block, the server stores it
 * and cross-checks it against historical attestations from the same device. This
 * is the server-side memory that makes log tampering detectable across submissions:
 *
 *   - A file whose `content_hash` changed but `first_ts`/`last_ts` are identical
 *     = the file was edited without the timestamps moving = tampering.
 *   - A file whose `mtime` is newer than its `last_ts` = edited after the session
 *     ended = tampering.
 *
 * The agent sends the attestation; the server remembers it. A fabricator who edits
 * their JSONL files between submissions is caught by the inconsistency.
 */

import { getSupabaseService } from '@/lib/supabase/server'
import type { SnapshotPayloadV1 } from '@/lib/payload/schema'
import type { GateReason } from '@/lib/ingest/gates'

const flag = (code: string, detail: string): GateReason => ({
  gate: 'attestation',
  code,
  severity: 'flag',
  detail,
})

export interface AttestationResult {
  flags: GateReason[]
  stored: boolean
}

/**
 * checkAndStoreAttestation — cross-check the payload's source_attestation against
 * historical attestations from the same device, then store the new attestation.
 *
 * Returns flags for any tampering signatures detected. Does NOT reject — the flags
 * feed into the gate decision via the caller (the route can upgrade the decision
 * from 'accept' to 'flag' if attestation flags are present).
 */
export async function checkAndStoreAttestation(
  payload: SnapshotPayloadV1,
  deviceId: string,
  operatorId: string | null,
): Promise<AttestationResult> {
  const attestation = (payload as SnapshotPayloadV1 & { source_attestation?: unknown[] }).source_attestation
  if (!attestation || !Array.isArray(attestation) || attestation.length === 0) {
    return { flags: [], stored: false }
  }

  const svc = getSupabaseService()
  if (!svc) return { flags: [], stored: false }

  const flags: GateReason[] = []

  // Cross-check each attested file against historical attestations from this device.
  for (const entry of attestation) {
    if (typeof entry !== 'object' || entry === null) continue
    const e = entry as {
      path_hash: string
      content_hash: string
      mtime: number
      first_ts?: string | null
      last_ts?: string | null
    }

    // Query historical attestations for this device + path_hash.
    const { data: historical } = await svc
      .from('source_attestations')
      .select('content_hash, first_ts, last_ts, mtime, recorded_at')
      .eq('device_id', deviceId)
      .eq('path_hash', e.path_hash)
      .order('recorded_at', { ascending: false })
      .limit(5)

    if (historical && historical.length > 0) {
      for (const h of historical) {
        const hRow = h as { content_hash: string; first_ts: string | null; last_ts: string | null; mtime: number | null }

        // Tampering signal 1: content_hash changed but timestamps are identical.
        if (
          hRow.content_hash !== e.content_hash &&
          hRow.first_ts === e.first_ts &&
          hRow.last_ts === e.last_ts
        ) {
          flags.push(
            flag(
              'attestation_tamper_hash_change',
              `file ${e.path_hash.slice(0, 8)}… content_hash changed but timestamps identical (log edited without session moving)`,
            ),
          )
          break // one flag per file is enough
        }

        // Tampering signal 2: mtime is newer than last_ts (edited after session ended).
        if (e.last_ts && hRow.mtime != null) {
          const lastTsMs = Date.parse(e.last_ts)
          const mtimeMs = e.mtime * 1000
          if (mtimeMs > lastTsMs + 60_000) {
            // 60s grace for clock skew
            flags.push(
              flag(
                'attestation_tamper_mtime',
                `file ${e.path_hash.slice(0, 8)}… mtime ${new Date(mtimeMs).toISOString()} > last_ts ${e.last_ts} (edited after session ended)`,
              ),
            )
            break
          }
        }
      }
    }
  }

  // Store the new attestation entries.
  const rows = attestation.map((entry) => {
    const e = entry as Record<string, unknown>
    return {
      device_id: deviceId,
      operator_id: operatorId,
      snapshot_hash: payload.agent.snapshot_hash,
      window_type: payload.window.type,
      window_start: payload.window.start,
      window_end: payload.window.end,
      path_hash: e.path_hash as string,
      content_hash: e.content_hash as string,
      mtime: e.mtime as number,
      size: e.size as number,
      lines: e.lines as number,
      first_ts: (e.first_ts as string | null) ?? null,
      last_ts: (e.last_ts as string | null) ?? null,
    }
  })

  if (rows.length > 0) {
    await svc.from('source_attestations').insert(rows)
  }

  return { flags, stored: true }
}
