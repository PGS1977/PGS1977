/**
 * Spare-capacity area calculations (brief §4.2).
 * Comparisons use unrounded values; rounding is for display only.
 */

import {
  RESULT_STATUS,
  type IssueCode,
  type ResultStatus,
} from '../domain/statuses'
import {
  resolveObstructionUnionMm2,
  type Rect,
} from './obstruction'

export const AREA_CALCULATION_VERSION = 'area-1.0.0' as const

/** A_cable = π × D_external² / 4 for a circular cable. */
export function cableAreaMm2(outsideDiameterMm: number): number {
  if (!Number.isFinite(outsideDiameterMm) || outsideDiameterMm < 0) {
    throw new Error(`Invalid outside diameter: ${String(outsideDiameterMm)}`)
  }
  return (Math.PI * outsideDiameterMm * outsideDiameterMm) / 4
}

/** Sum occupied area over actual physical cable instances (including parallels). */
export function sumCableAreasMm2(
  instances: ReadonlyArray<{ outsideDiameterMm: number }>,
): number {
  let sum = 0
  for (const c of instances) {
    sum += cableAreaMm2(c.outsideDiameterMm)
  }
  return sum
}

export type SpareAreaInput = {
  /** Usable internal envelope area (mm²). Missing → INCOMPLETE. */
  envelopeAreaMm2: number | null | undefined
  /** Obstruction rectangles for geometric union (preferred). */
  obstructionRects?: ReadonlyArray<Rect>
  /** Precomputed obstruction areas when using scalar synthetic inputs. */
  obstructionAreasMm2?: ReadonlyArray<number>
  /** Cable occupied areas already computed, or diameters to sum. */
  cableAreasMm2?: ReadonlyArray<number>
  cableDiametersMm?: ReadonlyArray<number>
  /** Spare target percent in [0, 100). Default 25. */
  spareTargetPercent: number
}

export type SpareAreaResult = {
  status: ResultStatus
  issueCode: IssueCode
  envelopeAreaMm2: number | null
  obstructionUnionMm2: number | null
  netAreaMm2: number | null
  cableAreaSumMm2: number
  sparePercent: number | null
  targetPercent: number
  evidence: string
  calculationVersion: typeof AREA_CALCULATION_VERSION
}

function sumNumbers(values: ReadonlyArray<number>): number {
  let s = 0
  for (const v of values) s += v
  return s
}

/**
 * A_net = A_internal_envelope − A_union_of_obstructions
 * Spare_percent = 100 × (A_net − sum(A_cable)) / A_net
 * Require Spare_percent >= selected_target.
 * Reject A_net <= 0 and targets outside 0 <= target < 100.
 */
export function evaluateSpareArea(input: SpareAreaInput): SpareAreaResult {
  const target = input.spareTargetPercent
  const cableAreaSumMm2 =
    input.cableAreasMm2 != null
      ? sumNumbers(input.cableAreasMm2)
      : input.cableDiametersMm != null
        ? sumCableAreasMm2(
            input.cableDiametersMm.map((d) => ({ outsideDiameterMm: d })),
          )
        : 0

  if (!(target >= 0 && target < 100) || !Number.isFinite(target)) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'AREA_TARGET_INVALID',
      envelopeAreaMm2: input.envelopeAreaMm2 ?? null,
      obstructionUnionMm2: null,
      netAreaMm2: null,
      cableAreaSumMm2,
      sparePercent: null,
      targetPercent: target,
      evidence: `Spare target ${String(target)} is outside [0, 100).`,
      calculationVersion: AREA_CALCULATION_VERSION,
    }
  }

  if (input.envelopeAreaMm2 == null || !Number.isFinite(input.envelopeAreaMm2)) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'AREA_ENVELOPE_MISSING',
      envelopeAreaMm2: null,
      obstructionUnionMm2: null,
      netAreaMm2: null,
      cableAreaSumMm2,
      sparePercent: null,
      targetPercent: target,
      evidence:
        'Usable internal envelope area is missing; area validation incomplete.',
      calculationVersion: AREA_CALCULATION_VERSION,
    }
  }

  const envelope = input.envelopeAreaMm2

  let obstructionUnionMm2 = 0
  if (input.obstructionRects != null && input.obstructionRects.length > 0) {
    obstructionUnionMm2 = resolveObstructionUnionMm2(
      input.obstructionRects.map((r) => ({ intrusionRectMm: r })),
    ).areaMm2
  } else if (
    input.obstructionAreasMm2 != null &&
    input.obstructionAreasMm2.length > 0
  ) {
    // Scalar path for synthetic AC02-style inputs where union is pre-established.
    // Callers must pass the union area (once), not raw overlapping duplicates.
    // For overlapping geometry use obstructionRects (AC03).
    obstructionUnionMm2 = sumNumbers(input.obstructionAreasMm2)
  }

  const netAreaMm2 = envelope - obstructionUnionMm2

  if (!(netAreaMm2 > 0)) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'AREA_NET_NON_POSITIVE',
      envelopeAreaMm2: envelope,
      obstructionUnionMm2,
      netAreaMm2,
      cableAreaSumMm2,
      sparePercent: null,
      targetPercent: target,
      evidence: `A_net (${netAreaMm2} mm²) is not positive after obstruction union.`,
      calculationVersion: AREA_CALCULATION_VERSION,
    }
  }

  // Unrounded comparison values.
  const sparePercent = (100 * (netAreaMm2 - cableAreaSumMm2)) / netAreaMm2
  const passes = sparePercent >= target

  return {
    status: passes ? RESULT_STATUS.PASS : RESULT_STATUS.ERROR,
    issueCode: passes ? 'AREA_TARGET_MET' : 'AREA_TARGET_NOT_MET',
    envelopeAreaMm2: envelope,
    obstructionUnionMm2,
    netAreaMm2,
    cableAreaSumMm2,
    sparePercent,
    targetPercent: target,
    evidence: passes
      ? `Spare ${sparePercent}% meets target ${target}%.`
      : `Spare ${sparePercent}% is below target ${target}%.`,
    calculationVersion: AREA_CALCULATION_VERSION,
  }
}

/**
 * Governing (minimum) spare along a section given local cross-section samples.
 * Local cleat/tie restrictions must surface as the governing result (AC15 prep).
 */
export function governingSpareAlongSection(
  samples: ReadonlyArray<SpareAreaInput>,
): SpareAreaResult | null {
  if (samples.length === 0) return null
  const results = samples.map(evaluateSpareArea)
  // Prefer ERROR / INCOMPLETE over PASS; among numeric spares, take minimum.
  const incomplete = results.find((r) => r.status === RESULT_STATUS.INCOMPLETE)
  if (incomplete) return incomplete
  const errors = results.filter((r) => r.status === RESULT_STATUS.ERROR)
  if (errors.length > 0) {
    return errors.reduce((worst, r) => {
      const a = worst.sparePercent
      const b = r.sparePercent
      if (a == null) return worst
      if (b == null) return r
      return b < a ? r : worst
    })
  }
  return results.reduce((min, r) => {
    if (min.sparePercent == null) return r
    if (r.sparePercent == null) return min
    return r.sparePercent < min.sparePercent ? r : min
  })
}
