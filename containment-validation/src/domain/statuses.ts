/**
 * Validation result states (brief §4.6).
 * Green (PASS) only when mandatory implemented checks pass on complete accepted inputs.
 * NOT_CHECKED identifies deferred modules and must not be included in overall compliance claims.
 */

import { z } from 'zod'

export const ResultStatusSchema = z.enum([
  'PASS',
  'ERROR',
  'INCOMPLETE',
  'STALE',
  'NOT_CHECKED',
])

export type ResultStatus = z.infer<typeof ResultStatusSchema>

export const RESULT_STATUS = {
  PASS: 'PASS',
  ERROR: 'ERROR',
  INCOMPLETE: 'INCOMPLETE',
  STALE: 'STALE',
  NOT_CHECKED: 'NOT_CHECKED',
} as const satisfies Record<ResultStatus, ResultStatus>

/** Issue codes used by area/weight engines in Increment A/B. */
export const IssueCodeSchema = z.enum([
  'AREA_TARGET_MET',
  'AREA_TARGET_NOT_MET',
  'AREA_NET_NON_POSITIVE',
  'AREA_ENVELOPE_MISSING',
  'AREA_TARGET_INVALID',
  'WEIGHT_COMPLETE',
  'WEIGHT_MASS_MISSING',
  'STRUCTURAL_SUPPORT_DEFERRED',
  'FIXING_GEOMETRY_MISSING',
])

export type IssueCode = z.infer<typeof IssueCodeSchema>
