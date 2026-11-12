/**
 * Bend-radius checks (brief §4.4).
 * Required condition: R_achieved >= R_required at every evaluated point.
 * UI wording: “Minimum bend radius not met” (never “radius exceeded”).
 * Comparisons use unrounded values — display rounding must not create a pass (AC05).
 */

import { RESULT_STATUS, type IssueCode, type ResultStatus } from '../domain/statuses'
import type { CentrePath, PathSegment } from './path'

export const BEND_CALCULATION_VERSION = 'bend-1.0.0' as const

export type BendConvention = 'centreline' | 'inner_surface'

export type BendCheckInput = {
  cableInstanceId: string
  /** Achieved centreline radius (mm) along the path (minimum). */
  achievedCentrelineRadiusMm: number | null | undefined
  /** Manufacturer required radius (mm) in the stated convention. */
  requiredRadiusMm: number | null | undefined
  requiredConvention: BendConvention | null | undefined
  /** Outside diameter needed to convert inner-surface → centreline. */
  outsideDiameterMm: number | null | undefined
}

export type BendCheckResult = {
  status: ResultStatus
  issueCode: IssueCode
  cableInstanceId: string
  achievedCentrelineRadiusMm: number | null
  /** Required radius expressed on the centreline for comparison. */
  requiredCentrelineRadiusMm: number | null
  requiredRadiusMmAsSpecified: number | null
  requiredConvention: BendConvention | null
  /** Engineer-facing message; uses mandated wording on failure. */
  message: string
  evidence: string
  calculationVersion: typeof BEND_CALCULATION_VERSION
}

/**
 * Convert a manufacturer required radius onto the centreline for comparison.
 * If the specification is for the cable inner surface, centreline = R_inner + D/2
 * for circular cable geometry. Do not invent multipliers for missing data.
 */
export function requiredRadiusToCentrelineMm(args: {
  requiredRadiusMm: number
  convention: BendConvention
  outsideDiameterMm: number
}): number {
  if (args.convention === 'centreline') return args.requiredRadiusMm
  return args.requiredRadiusMm + args.outsideDiameterMm / 2
}

/** Minimum centreline radius among arc segments on a path; null if no arcs. */
export function minAchievedCentrelineRadiusMm(path: CentrePath): number | null {
  let min: number | null = null
  for (const seg of path.segments) {
    if (seg.kind === 'arc') {
      min = min == null ? seg.radiusMm : Math.min(min, seg.radiusMm)
    }
  }
  return min
}

export function evaluateBendRadius(input: BendCheckInput): BendCheckResult {
  const achieved =
    input.achievedCentrelineRadiusMm != null &&
    Number.isFinite(input.achievedCentrelineRadiusMm)
      ? input.achievedCentrelineRadiusMm
      : null

  const requiredRaw =
    input.requiredRadiusMm != null && Number.isFinite(input.requiredRadiusMm)
      ? input.requiredRadiusMm
      : null

  const convention = input.requiredConvention ?? null
  const od =
    input.outsideDiameterMm != null && Number.isFinite(input.outsideDiameterMm)
      ? input.outsideDiameterMm
      : null

  if (requiredRaw == null || convention == null) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'BEND_RADIUS_DATA_MISSING',
      cableInstanceId: input.cableInstanceId,
      achievedCentrelineRadiusMm: achieved,
      requiredCentrelineRadiusMm: null,
      requiredRadiusMmAsSpecified: requiredRaw,
      requiredConvention: convention,
      message: 'Bend radius check incomplete — manufacturer radius data missing.',
      evidence:
        'Required bend radius and/or convention is missing; do not invent multipliers.',
      calculationVersion: BEND_CALCULATION_VERSION,
    }
  }

  if (convention === 'inner_surface' && od == null) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'BEND_RADIUS_DATA_MISSING',
      cableInstanceId: input.cableInstanceId,
      achievedCentrelineRadiusMm: achieved,
      requiredCentrelineRadiusMm: null,
      requiredRadiusMmAsSpecified: requiredRaw,
      requiredConvention: convention,
      message:
        'Bend radius check incomplete — outside diameter required to convert inner-surface specification.',
      evidence:
        'Inner-surface convention needs OD to obtain comparable centreline radius.',
      calculationVersion: BEND_CALCULATION_VERSION,
    }
  }

  if (achieved == null) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'BEND_RADIUS_DATA_MISSING',
      cableInstanceId: input.cableInstanceId,
      achievedCentrelineRadiusMm: null,
      requiredCentrelineRadiusMm: null,
      requiredRadiusMmAsSpecified: requiredRaw,
      requiredConvention: convention,
      message: 'Bend radius check incomplete — achieved path radius missing.',
      evidence: 'No achieved centreline radius available for comparison.',
      calculationVersion: BEND_CALCULATION_VERSION,
    }
  }

  const requiredCentreline = requiredRadiusToCentrelineMm({
    requiredRadiusMm: requiredRaw,
    convention,
    outsideDiameterMm: od ?? 0,
  })

  // Unrounded comparison (AC05: 299 must not pass a 300 requirement).
  if (achieved + 1e-12 < requiredCentreline) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'BEND_RADIUS_NOT_MET',
      cableInstanceId: input.cableInstanceId,
      achievedCentrelineRadiusMm: achieved,
      requiredCentrelineRadiusMm: requiredCentreline,
      requiredRadiusMmAsSpecified: requiredRaw,
      requiredConvention: convention,
      message: 'Minimum bend radius not met',
      evidence: `Achieved centreline radius ${achieved} mm < required centreline ${requiredCentreline} mm (specified ${requiredRaw} mm as ${convention}).`,
      calculationVersion: BEND_CALCULATION_VERSION,
    }
  }

  return {
    status: RESULT_STATUS.PASS,
    issueCode: 'BEND_RADIUS_OK',
    cableInstanceId: input.cableInstanceId,
    achievedCentrelineRadiusMm: achieved,
    requiredCentrelineRadiusMm: requiredCentreline,
    requiredRadiusMmAsSpecified: requiredRaw,
    requiredConvention: convention,
    message: 'Minimum bend radius met',
    evidence: `Achieved centreline radius ${achieved} mm >= required centreline ${requiredCentreline} mm (same convention comparison).`,
    calculationVersion: BEND_CALCULATION_VERSION,
  }
}

/** Evaluate bend checks for every arc-bearing path. */
export function evaluateBendRadiiForPaths(
  paths: ReadonlyArray<CentrePath>,
  requirements: ReadonlyMap<
    string,
    {
      requiredRadiusMm: number | null | undefined
      requiredConvention: BendConvention | null | undefined
      outsideDiameterMm: number | null | undefined
    }
  >,
): BendCheckResult[] {
  return paths.map((path) => {
    const req = requirements.get(path.cableInstanceId)
    return evaluateBendRadius({
      cableInstanceId: path.cableInstanceId,
      achievedCentrelineRadiusMm: minAchievedCentrelineRadiusMm(path),
      requiredRadiusMm: req?.requiredRadiusMm,
      requiredConvention: req?.requiredConvention,
      outsideDiameterMm: req?.outsideDiameterMm,
    })
  })
}

/** True if segment list contains at least one arc. */
export function pathHasBend(segments: readonly PathSegment[]): boolean {
  return segments.some((s) => s.kind === 'arc')
}
