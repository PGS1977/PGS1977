/**
 * Combined validation across area, arrangement and bend (brief §4.3–4.6).
 * Area pass + spacing fail → fit error; no overall pass (AC04).
 * Local cleat/obstruction samples: governing restriction reported (AC15).
 */

import { RESULT_STATUS, type IssueCode, type ResultStatus } from '../domain/statuses'
import {
  evaluateSpareArea,
  type SpareAreaInput,
  type SpareAreaResult,
} from './area'
import type { BendCheckResult } from './bend'
import {
  arrangeCables,
  type ArrangementResult,
  type ArrangementSettings,
  type EnvelopeRect,
  type PlacementCable,
} from './placement'
import type { Rect } from './obstruction'

export const OVERALL_CALCULATION_VERSION = 'overall-1.0.0' as const

export type OverallValidationResult = {
  status: ResultStatus
  issueCode: IssueCode
  area: SpareAreaResult
  arrangement: ArrangementResult
  bendResults?: BendCheckResult[]
  evidence: string
  calculationVersion: typeof OVERALL_CALCULATION_VERSION
}

/**
 * AC04: if spare/area passes but arrangement/spacing fails, overall is ERROR
 * (fit), never PASS.
 */
export function evaluateAreaAndArrangement(args: {
  area: SpareAreaInput
  cables: ReadonlyArray<PlacementCable>
  envelope: EnvelopeRect
  arrangement: ArrangementSettings
  obstacles?: ReadonlyArray<Rect>
}): OverallValidationResult {
  const area = evaluateSpareArea(args.area)
  const arrangement = arrangeCables({
    cables: args.cables,
    envelope: args.envelope,
    settings: args.arrangement,
    obstacles: args.obstacles,
  })

  if (
    area.status === RESULT_STATUS.INCOMPLETE ||
    arrangement.status === RESULT_STATUS.INCOMPLETE
  ) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'OVERALL_INCOMPLETE',
      area,
      arrangement,
      evidence: `Incomplete inputs: area=${area.status}/${area.issueCode}; arrangement=${arrangement.status}/${arrangement.issueCode}.`,
      calculationVersion: OVERALL_CALCULATION_VERSION,
    }
  }

  if (area.status === RESULT_STATUS.PASS && arrangement.status !== RESULT_STATUS.PASS) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'OVERALL_FIT_ERROR',
      area,
      arrangement,
      evidence: `Area/spare target met (${area.sparePercent}% >= ${area.targetPercent}%), but arrangement/spacing failed (${arrangement.issueCode}). No overall pass.`,
      calculationVersion: OVERALL_CALCULATION_VERSION,
    }
  }

  if (area.status !== RESULT_STATUS.PASS) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: area.issueCode,
      area,
      arrangement,
      evidence: `Area check failed (${area.issueCode}). Arrangement status ${arrangement.status}.`,
      calculationVersion: OVERALL_CALCULATION_VERSION,
    }
  }

  if (arrangement.status !== RESULT_STATUS.PASS) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'OVERALL_FIT_ERROR',
      area,
      arrangement,
      evidence: arrangement.evidence,
      calculationVersion: OVERALL_CALCULATION_VERSION,
    }
  }

  return {
    status: RESULT_STATUS.PASS,
    issueCode: 'OVERALL_PASS',
    area,
    arrangement,
    evidence: 'Area and arrangement checks both passed.',
    calculationVersion: OVERALL_CALCULATION_VERSION,
  }
}

export type LocalSectionSample = {
  sampleId: string
  /** Optional location note (e.g. cleat chainage). */
  locationNote?: string
  area: SpareAreaInput
  cables: ReadonlyArray<PlacementCable>
  envelope: EnvelopeRect
  arrangement: ArrangementSettings
  obstacles?: ReadonlyArray<Rect>
}

export type LocalRestrictionReport = {
  status: ResultStatus
  issueCode: IssueCode
  governingSampleId: string | null
  samples: Array<{
    sampleId: string
    locationNote?: string
    overall: OverallValidationResult
  }>
  evidence: string
}

/**
 * AC15: evaluate multiple cross-section samples along a section (e.g. clear
 * span vs local cleat). Report the governing local fit/spare restriction.
 */
export function evaluateLocalRestrictions(
  samples: ReadonlyArray<LocalSectionSample>,
): LocalRestrictionReport {
  if (samples.length === 0) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'OVERALL_INCOMPLETE',
      governingSampleId: null,
      samples: [],
      evidence: 'No cross-section samples provided.',
    }
  }

  const evaluated = samples.map((s) => ({
    sampleId: s.sampleId,
    locationNote: s.locationNote,
    overall: evaluateAreaAndArrangement({
      area: s.area,
      cables: s.cables,
      envelope: s.envelope,
      arrangement: s.arrangement,
      obstacles: s.obstacles,
    }),
  }))

  const failures = evaluated.filter((e) => e.overall.status !== RESULT_STATUS.PASS)
  if (failures.length === 0) {
    return {
      status: RESULT_STATUS.PASS,
      issueCode: 'OVERALL_PASS',
      governingSampleId: evaluated[0]!.sampleId,
      samples: evaluated,
      evidence: 'All sampled cross-sections passed area and arrangement checks.',
    }
  }

  // Prefer arrangement/fit failures as governing when present; else worst spare.
  const fit = failures.find(
    (f) =>
      f.overall.issueCode === 'OVERALL_FIT_ERROR' ||
      f.overall.arrangement.status === RESULT_STATUS.ERROR,
  )
  const governing = fit ?? failures[0]!

  return {
    status: RESULT_STATUS.ERROR,
    issueCode: 'LOCAL_RESTRICTION_GOVERNING',
    governingSampleId: governing.sampleId,
    samples: evaluated,
    evidence: `Governing local restriction at sample "${governing.sampleId}"${
      governing.locationNote ? ` (${governing.locationNote})` : ''
    }: ${governing.overall.evidence}`,
  }
}

/** Fold bend results into an overall outcome (bend ERROR prevents overall PASS). */
export function combineWithBend(
  base: OverallValidationResult,
  bendResults: BendCheckResult[],
): OverallValidationResult {
  const bendError = bendResults.find((b) => b.status === RESULT_STATUS.ERROR)
  const bendIncomplete = bendResults.find(
    (b) => b.status === RESULT_STATUS.INCOMPLETE,
  )

  if (bendError) {
    return {
      ...base,
      status: RESULT_STATUS.ERROR,
      issueCode: bendError.issueCode,
      bendResults,
      evidence: `${bendError.message}. ${bendError.evidence} (other checks: ${base.status}/${base.issueCode}).`,
    }
  }

  if (bendIncomplete && base.status === RESULT_STATUS.PASS) {
    return {
      ...base,
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'OVERALL_INCOMPLETE',
      bendResults,
      evidence: `Bend data incomplete. ${bendIncomplete.evidence}`,
    }
  }

  if (base.status !== RESULT_STATUS.PASS) {
    return { ...base, bendResults }
  }

  return {
    ...base,
    bendResults,
    evidence: `${base.evidence} Bend checks passed.`,
  }
}
