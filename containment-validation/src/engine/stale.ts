/**
 * Stale result marking (brief §4.6, AC10).
 * Geometry, cable, fixing, scale, product or rule changes mark affected results stale
 * until recalculated against the current input revision/hash.
 */

import { RESULT_STATUS, type ValidationResult } from '../domain'

export const STALE_CALCULATION_VERSION = 'stale-1.0.0' as const

/** Stable hash of project calculation inputs (not cryptographic). */
export function hashInputs(parts: ReadonlyArray<string | number | boolean | null | undefined>): string {
  const payload = parts.map((p) => (p == null ? '' : String(p))).join('|')
  let h = 2166136261
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `inp_${(h >>> 0).toString(16)}`
}

/**
 * Mark results STALE when their recorded input revision/hash no longer matches
 * the current project input hash. Already-STALE rows stay STALE.
 * Does not recalculate — callers must re-run engines to clear stale.
 */
export function markStaleResults(
  results: ReadonlyArray<ValidationResult>,
  currentInputRevisionOrHash: string,
): ValidationResult[] {
  return results.map((r) => {
    if (r.inputRevisionOrHash === currentInputRevisionOrHash) {
      return { ...r }
    }
    if (r.status === RESULT_STATUS.STALE) {
      return { ...r }
    }
    return {
      ...r,
      status: RESULT_STATUS.STALE,
      evidence: `Result is stale: recorded input ${r.inputRevisionOrHash} ≠ current ${currentInputRevisionOrHash}. Recalculate before relying on this status.`,
    }
  })
}

export function anyStale(results: ReadonlyArray<ValidationResult>): boolean {
  return results.some((r) => r.status === RESULT_STATUS.STALE)
}
