/**
 * Deferred / not-checked modules (brief §4.5, AC16).
 * Support-span and structural adequacy are not issued in Milestone 1.
 * Weight results remain available independently.
 */

import { RESULT_STATUS, type ValidationResult } from '../domain'
import { WEIGHT_CALCULATION_VERSION } from './weight'
import type { WeightResult } from './weight'

export const STRUCTURAL_MODULE_ID = 'structural_support_spans' as const

/**
 * Structural / support-span panel state for AC16.
 * Always NOT_CHECKED in M1; never claims a structural pass.
 */
export function structuralSupportPanelResult(args: {
  id: string
  inputRevisionOrHash: string
  sectionOrFittingId?: string
}): ValidationResult {
  return {
    schemaVersion: '1.0.0',
    id: args.id,
    calculationVersion: 'structural-deferred-0',
    inputRevisionOrHash: args.inputRevisionOrHash,
    productDataRevisions: [],
    check: STRUCTURAL_MODULE_ID,
    status: RESULT_STATUS.NOT_CHECKED,
    issueCode: 'STRUCTURAL_SUPPORT_DEFERRED',
    sectionOrFittingId: args.sectionOrFittingId,
    evidence:
      'Recommended support spans and structural loading assessment are deferred. Weight remains available; no structural pass is issued.',
    measured: [],
  }
}

/** Pair weight availability with deferred structural status (AC16). */
export function weightAvailableWithDeferredStructural(weight: WeightResult): {
  weight: WeightResult
  structuralStatus: typeof RESULT_STATUS.NOT_CHECKED
  structuralIssueCode: 'STRUCTURAL_SUPPORT_DEFERRED'
  note: string
} {
  return {
    weight,
    structuralStatus: RESULT_STATUS.NOT_CHECKED,
    structuralIssueCode: 'STRUCTURAL_SUPPORT_DEFERRED',
    note: `Weight calculation ${WEIGHT_CALCULATION_VERSION} is available; structural/support-span checks are NOT_CHECKED.`,
  }
}
