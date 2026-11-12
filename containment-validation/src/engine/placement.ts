/**
 * Deterministic cable placement within a usable cross-section envelope (brief §4.3).
 *
 * Assumptions (owner review — AS01 in data-gap register):
 * - Spaced means clear surface-to-surface gap.
 * - Unequal-diameter spacing reference = max(D1, D2).
 *
 * Centre positions are independent of any render mesh. Clash checks sweep the
 * outside diameter as a circle in the cross-section plane (and along paths via
 * sampled centreline + OD when callers request path clash).
 */

import { RESULT_STATUS, type IssueCode, type ResultStatus } from '../domain/statuses'
import type { Rect } from './obstruction'

export const PLACEMENT_CALCULATION_VERSION = 'placement-1.0.0' as const

/** Documented provisional assumption AS01. */
export const UNEQUAL_DIAMETER_SPACING_ASSUMPTION =
  'AS01: unequal-diameter spaced clear-gap reference uses max(D1, D2); provisional pending owner review.' as const

export type ArrangementMode = 'touching' | 'spaced' | 'stacked'

export type PlacementCable = {
  cableInstanceId: string
  outsideDiameterMm: number
}

export type ArrangementSettings = {
  mode: ArrangementMode
  /**
   * Spaced multiplier of the spacing reference diameter.
   * 1 → 1D, 2 → 2D, or any custom positive multiplier.
   * Ignored for touching.
   */
  spacedMultiplier?: number
  /** Required for stacked: explicit layer count. */
  stackedLayerCount?: number
  /** Required for stacked: vertical clear gap between layers (mm). */
  stackedVerticalGapMm?: number
  /**
   * Maximum placement attempts before ERROR_NO_VALID_ARRANGEMENT_FOUND (AC14).
   * Each attempt is a deterministic offset/order variant — no randomness.
   */
  searchLimit?: number
}

export type PlacedCable = {
  cableInstanceId: string
  outsideDiameterMm: number
  centreXMm: number
  centreYMm: number
}

export type ArrangementResult = {
  status: ResultStatus
  issueCode: IssueCode
  placements: PlacedCable[]
  /** Clear surface-to-surface gap required by settings (mm), when applicable. */
  requiredClearGapMm: number | null
  /** Spacing reference used for unequal diameters (AS01). */
  spacingReferenceMm: number | null
  assumptions: string[]
  searchAttempts: number
  searchLimit: number
  evidence: string
  calculationVersion: typeof PLACEMENT_CALCULATION_VERSION
}

export type EnvelopeRect = {
  widthMm: number
  heightMm: number
  /** Origin of usable envelope; default (0,0) bottom-left. */
  originXMm?: number
  originYMm?: number
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite positive number, got ${String(value)}`)
  }
}

/** Required clear surface-to-surface gap for a pair under current settings. */
export function requiredClearGapMm(
  d1: number,
  d2: number,
  settings: ArrangementSettings,
): number {
  if (settings.mode === 'touching') return 0
  if (settings.mode === 'stacked') {
    // Within a layer treat as touching unless spacedMultiplier also set;
    // vertical gap is handled separately via stackedVerticalGapMm.
    if (settings.spacedMultiplier != null) {
      const ref = Math.max(d1, d2)
      return settings.spacedMultiplier * ref
    }
    return 0
  }
  // spaced
  const mult = settings.spacedMultiplier ?? 1
  const ref = Math.max(d1, d2) // AS01
  return mult * ref
}

function circlesClash(
  a: PlacedCable,
  b: PlacedCable,
  minClearGapMm: number,
): boolean {
  const minCentreDist = a.outsideDiameterMm / 2 + b.outsideDiameterMm / 2 + minClearGapMm
  const dx = a.centreXMm - b.centreXMm
  const dy = a.centreYMm - b.centreYMm
  // Use unrounded comparison; allow tiny numeric epsilon only for float noise.
  const dist = Math.hypot(dx, dy)
  return dist + 1e-9 < minCentreDist
}

function circleHitsRectObstacle(c: PlacedCable, rect: Rect): boolean {
  // Clash if circle intersects axis-aligned rectangle (intrusion into envelope).
  const nearestX = Math.max(rect.xMm, Math.min(c.centreXMm, rect.xMm + rect.widthMm))
  const nearestY = Math.max(rect.yMm, Math.min(c.centreYMm, rect.yMm + rect.heightMm))
  const dx = c.centreXMm - nearestX
  const dy = c.centreYMm - nearestY
  const r = c.outsideDiameterMm / 2
  return dx * dx + dy * dy < r * r - 1e-9
}

function insideEnvelope(c: PlacedCable, env: EnvelopeRect): boolean {
  const ox = env.originXMm ?? 0
  const oy = env.originYMm ?? 0
  const r = c.outsideDiameterMm / 2
  return (
    c.centreXMm - r >= ox - 1e-9 &&
    c.centreXMm + r <= ox + env.widthMm + 1e-9 &&
    c.centreYMm - r >= oy - 1e-9 &&
    c.centreYMm + r <= oy + env.heightMm + 1e-9
  )
}

function validatePlacement(
  placements: PlacedCable[],
  settings: ArrangementSettings,
  envelope: EnvelopeRect,
  obstacles: ReadonlyArray<Rect>,
): { ok: boolean; reason: string } {
  for (const c of placements) {
    if (!insideEnvelope(c, envelope)) {
      return {
        ok: false,
        reason: `Cable ${c.cableInstanceId} outside usable envelope.`,
      }
    }
    for (const obs of obstacles) {
      if (circleHitsRectObstacle(c, obs)) {
        return {
          ok: false,
          reason: `Cable ${c.cableInstanceId} clashes with obstruction.`,
        }
      }
    }
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i]!
      const b = placements[j]!
      const gap = requiredClearGapMm(a.outsideDiameterMm, b.outsideDiameterMm, settings)
      // Stacked vertical neighbours use stackedVerticalGapMm when in different layers.
      const sameLayer = Math.abs(a.centreYMm - b.centreYMm) < 1e-6
      const effectiveGap =
        settings.mode === 'stacked' && !sameLayer
          ? (settings.stackedVerticalGapMm ?? 0)
          : gap
      if (circlesClash(a, b, effectiveGap)) {
        return {
          ok: false,
          reason: `Spacing/clash failure between ${a.cableInstanceId} and ${b.cableInstanceId} (required clear gap ${effectiveGap} mm).`,
        }
      }
    }
  }
  return { ok: true, reason: 'Arrangement valid.' }
}

/**
 * Deterministic row packing from a start X offset.
 * Cables must already be in the desired left-to-right order.
 */
function packRow(
  cables: readonly PlacementCable[],
  settings: ArrangementSettings,
  envelope: EnvelopeRect,
  centreYMm: number,
  startXOffsetMm: number,
): PlacedCable[] | null {
  const ox = envelope.originXMm ?? 0
  const placements: PlacedCable[] = []
  let cursor = ox + startXOffsetMm

  for (let i = 0; i < cables.length; i++) {
    const c = cables[i]!
    assertPositive(c.outsideDiameterMm, `Cable ${c.cableInstanceId} diameter`)
    const r = c.outsideDiameterMm / 2
    if (i === 0) {
      cursor = Math.max(cursor, ox) + r
    } else {
      const prev = placements[i - 1]!
      const gap = requiredClearGapMm(prev.outsideDiameterMm, c.outsideDiameterMm, settings)
      cursor = prev.centreXMm + prev.outsideDiameterMm / 2 + gap + r
    }
    placements.push({
      cableInstanceId: c.cableInstanceId,
      outsideDiameterMm: c.outsideDiameterMm,
      centreXMm: cursor,
      centreYMm,
    })
  }

  // Entire row must fit width.
  const last = placements[placements.length - 1]
  if (last && last.centreXMm + last.outsideDiameterMm / 2 > ox + envelope.widthMm + 1e-9) {
    return null
  }
  return placements
}

function packStacked(
  ordered: readonly PlacementCable[],
  settings: ArrangementSettings,
  envelope: EnvelopeRect,
  startXOffsetMm: number,
): PlacedCable[] | null {
  const layers = settings.stackedLayerCount
  const vGap = settings.stackedVerticalGapMm
  if (layers == null || !(layers > 0) || vGap == null || vGap < 0) {
    return null
  }
  const oy = envelope.originYMm ?? 0
  const perLayer = Math.ceil(ordered.length / layers)
  const placements: PlacedCable[] = []
  let yCursor = oy

  for (let layer = 0; layer < layers; layer++) {
    const slice = ordered.slice(layer * perLayer, (layer + 1) * perLayer)
    if (slice.length === 0) break
    const maxD = Math.max(...slice.map((c) => c.outsideDiameterMm))
    const centreY = yCursor + maxD / 2
    if (centreY + maxD / 2 > oy + envelope.heightMm + 1e-9) return null
    const row = packRow(slice, settings, envelope, centreY, startXOffsetMm)
    if (!row) return null
    placements.push(...row)
    yCursor = centreY + maxD / 2 + vGap
  }
  return placements
}

function packSingleLayer(
  ordered: readonly PlacementCable[],
  settings: ArrangementSettings,
  envelope: EnvelopeRect,
  startXOffsetMm: number,
): PlacedCable[] | null {
  const oy = envelope.originYMm ?? 0
  const maxD = Math.max(...ordered.map((c) => c.outsideDiameterMm))
  const centreY = oy + maxD / 2
  if (centreY + maxD / 2 > oy + envelope.heightMm + 1e-9) return null
  return packRow(ordered, settings, envelope, centreY, startXOffsetMm)
}

/** Stable sort by cableInstanceId for reproducibility. */
export function sortCablesDeterministically(
  cables: readonly PlacementCable[],
): PlacementCable[] {
  return [...cables].sort((a, b) =>
    a.cableInstanceId < b.cableInstanceId
      ? -1
      : a.cableInstanceId > b.cableInstanceId
        ? 1
        : 0,
  )
}

/**
 * Attempt to place cables. Search variants are deterministic offsets and a
 * single reversed-order attempt — never random. Exhausting searchLimit yields
 * ERROR_NO_VALID_ARRANGEMENT_FOUND without claiming mathematical impossibility (AC14).
 */
export function arrangeCables(args: {
  cables: ReadonlyArray<PlacementCable>
  envelope: EnvelopeRect
  settings: ArrangementSettings
  obstacles?: ReadonlyArray<Rect>
}): ArrangementResult {
  const obstacles = args.obstacles ?? []
  const searchLimit = args.settings.searchLimit ?? 32
  const assumptions: string[] = []

  if (args.cables.length === 0) {
    return {
      status: RESULT_STATUS.PASS,
      issueCode: 'ARRANGEMENT_VALID',
      placements: [],
      requiredClearGapMm: 0,
      spacingReferenceMm: null,
      assumptions,
      searchAttempts: 0,
      searchLimit,
      evidence: 'No cables to place.',
      calculationVersion: PLACEMENT_CALCULATION_VERSION,
    }
  }

  if (args.settings.mode === 'spaced') {
    assumptions.push(UNEQUAL_DIAMETER_SPACING_ASSUMPTION)
  }
  if (args.settings.mode === 'stacked') {
    if (args.settings.stackedLayerCount == null || args.settings.stackedVerticalGapMm == null) {
      return {
        status: RESULT_STATUS.INCOMPLETE,
        issueCode: 'ARRANGEMENT_INPUT_INCOMPLETE',
        placements: [],
        requiredClearGapMm: null,
        spacingReferenceMm: null,
        assumptions: [
          'AS02: stacked layer count and vertical gap are explicit project inputs.',
        ],
        searchAttempts: 0,
        searchLimit,
        evidence:
          'Stacked arrangement requires explicit stackedLayerCount and stackedVerticalGapMm.',
        calculationVersion: PLACEMENT_CALCULATION_VERSION,
      }
    }
  }

  const diameters = args.cables.map((c) => c.outsideDiameterMm)
  if (diameters.some((d) => !Number.isFinite(d) || d <= 0)) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'ARRANGEMENT_INPUT_INCOMPLETE',
      placements: [],
      requiredClearGapMm: null,
      spacingReferenceMm: null,
      assumptions,
      searchAttempts: 0,
      searchLimit,
      evidence: 'One or more cable outside diameters are missing or invalid.',
      calculationVersion: PLACEMENT_CALCULATION_VERSION,
    }
  }

  const spacingReferenceMm =
    args.settings.mode === 'spaced'
      ? Math.max(...diameters)
      : null
  const requiredClearGapMmValue =
    args.settings.mode === 'touching'
      ? 0
      : args.settings.mode === 'spaced'
        ? (args.settings.spacedMultiplier ?? 1) * (spacingReferenceMm as number)
        : (args.settings.stackedVerticalGapMm ?? null)

  const baseOrder = sortCablesDeterministically(args.cables)
  const orders = [baseOrder, [...baseOrder].reverse()]

  // Deterministic start-X offsets: 0, 1, 2, ... mm until search limit.
  let attempts = 0
  let lastFailure = 'No valid arrangement found within search limit.'

  for (const order of orders) {
    for (let offset = 0; offset < searchLimit; offset++) {
      if (attempts >= searchLimit) break
      attempts++
      const packed =
        args.settings.mode === 'stacked'
          ? packStacked(order, args.settings, args.envelope, offset)
          : packSingleLayer(order, args.settings, args.envelope, offset)
      if (!packed) {
        lastFailure = 'Row/stack packing exceeded usable envelope.'
        continue
      }
      const check = validatePlacement(packed, args.settings, args.envelope, obstacles)
      if (check.ok) {
        const clearGapDisplay =
          args.settings.mode === 'spaced' ? requiredClearGapMmValue : requiredClearGapMmValue
        return {
          status: RESULT_STATUS.PASS,
          issueCode: 'ARRANGEMENT_VALID',
          placements: packed,
          requiredClearGapMm:
            typeof clearGapDisplay === 'number' ? clearGapDisplay : null,
          spacingReferenceMm,
          assumptions,
          searchAttempts: attempts,
          searchLimit,
          evidence: `Valid ${args.settings.mode} arrangement after ${attempts} search attempt(s).${
            args.settings.mode === 'spaced'
              ? ` Clear gap ${String(requiredClearGapMmValue)} mm (reference max D = ${String(spacingReferenceMm)} mm).`
              : ''
          }`,
          calculationVersion: PLACEMENT_CALCULATION_VERSION,
        }
      }
      lastFailure = check.reason
      // For a given order, only the first offsets that change packing matter;
      // continue scanning offsets as documented search variants.
    }
    if (attempts >= searchLimit) break
  }

  // Distinguish "clearly does not fit even at offset 0 with both orders"
  // vs search exhaustion. If we used the full searchLimit, AC14 applies.
  const exhausted = attempts >= searchLimit
  if (exhausted) {
    return {
      status: RESULT_STATUS.ERROR,
      issueCode: 'ERROR_NO_VALID_ARRANGEMENT_FOUND',
      placements: [],
      requiredClearGapMm:
        typeof requiredClearGapMmValue === 'number' ? requiredClearGapMmValue : null,
      spacingReferenceMm,
      assumptions,
      searchAttempts: attempts,
      searchLimit,
      evidence: `No valid arrangement found within search limit (${searchLimit} attempts). This does not prove mathematical impossibility. Last failure: ${lastFailure}`,
      calculationVersion: PLACEMENT_CALCULATION_VERSION,
    }
  }

  return {
    status: RESULT_STATUS.ERROR,
    issueCode: 'ARRANGEMENT_SPACING_NOT_ACHIEVED',
    placements: [],
    requiredClearGapMm:
      typeof requiredClearGapMmValue === 'number' ? requiredClearGapMmValue : null,
    spacingReferenceMm,
    assumptions,
    searchAttempts: attempts,
    searchLimit,
    evidence: `Specified spacing/arrangement cannot be achieved in the usable envelope. ${lastFailure}`,
    calculationVersion: PLACEMENT_CALCULATION_VERSION,
  }
}

/**
 * Path clash check: sweep OD along sampled centre paths.
 * Returns clashing cable pair IDs if any centre samples are closer than
 * (r1+r2) allowing touching (clear gap 0) unless minClearGapMm provided.
 */
export function pathSweepClash(args: {
  paths: ReadonlyArray<{
    cableInstanceId: string
    outsideDiameterMm: number
    samples: ReadonlyArray<{ x: number; y: number }>
  }>
  minClearGapMm?: number
}): { clash: boolean; a?: string; b?: string; evidence: string } {
  const gap = args.minClearGapMm ?? 0
  for (let i = 0; i < args.paths.length; i++) {
    for (let j = i + 1; j < args.paths.length; j++) {
      const a = args.paths[i]!
      const b = args.paths[j]!
      const minDist = a.outsideDiameterMm / 2 + b.outsideDiameterMm / 2 + gap
      for (const pa of a.samples) {
        for (const pb of b.samples) {
          if (Math.hypot(pa.x - pb.x, pa.y - pb.y) + 1e-9 < minDist) {
            return {
              clash: true,
              a: a.cableInstanceId,
              b: b.cableInstanceId,
              evidence: `Path OD sweep clash between ${a.cableInstanceId} and ${b.cableInstanceId}.`,
            }
          }
        }
      }
    }
  }
  return { clash: false, evidence: 'No path OD sweep clash detected at sampling resolution.' }
}
