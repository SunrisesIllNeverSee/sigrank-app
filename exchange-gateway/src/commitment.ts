import { createHash } from 'node:crypto'
import { ContributionCommitmentSchema } from './schema'
import type { ContributionCommitment } from './types'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

export function commitmentHash(input: ContributionCommitment): string {
  const copy = structuredClone(input)
  delete copy.provenance.terms_hash
  const canonical = JSON.stringify(canonicalize(copy))
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}

export function finalizeCommitment(input: unknown): ContributionCommitment {
  const parsed = ContributionCommitmentSchema.parse(input) as ContributionCommitment
  return {
    ...parsed,
    provenance: {
      ...parsed.provenance,
      terms_hash: commitmentHash(parsed),
    },
  }
}
