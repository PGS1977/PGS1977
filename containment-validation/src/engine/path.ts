/**
 * Cable centre paths independent of display meshes (brief §4.3).
 * Analytic line/arc geometry for Milestone 1 straight + horizontal 90° bend.
 */

export type Vec2 = { x: number; y: number }

export type LineSegment = {
  kind: 'line'
  start: Vec2
  end: Vec2
}

export type ArcSegment = {
  kind: 'arc'
  /** Arc centre. */
  centre: Vec2
  /** Centreline radius (mm). */
  radiusMm: number
  /** Start angle (radians), CCW from +x. */
  startAngleRad: number
  /** Signed sweep (radians). Positive = CCW. */
  sweepRad: number
}

export type PathSegment = LineSegment | ArcSegment

export type CentrePath = {
  /** Stable cable instance identity — preserved across components. */
  cableInstanceId: string
  segments: PathSegment[]
}

export function lineLengthMm(seg: LineSegment): number {
  const dx = seg.end.x - seg.start.x
  const dy = seg.end.y - seg.start.y
  return Math.hypot(dx, dy)
}

export function arcLengthMm(seg: ArcSegment): number {
  return Math.abs(seg.sweepRad) * seg.radiusMm
}

export function pathLengthMm(path: CentrePath): number {
  let total = 0
  for (const seg of path.segments) {
    total += seg.kind === 'line' ? lineLengthMm(seg) : arcLengthMm(seg)
  }
  return total
}

/** Point on an arc at parametric t in [0, 1]. */
export function arcPoint(seg: ArcSegment, t: number): Vec2 {
  const angle = seg.startAngleRad + seg.sweepRad * t
  return {
    x: seg.centre.x + seg.radiusMm * Math.cos(angle),
    y: seg.centre.y + seg.radiusMm * Math.sin(angle),
  }
}

/**
 * Sample centreline points along a path.
 * Approximation error for chord sampling is bounded by:
 *   max_chord_error ≈ R × (1 − cos(Δθ/2)) for arcs with step Δθ.
 * Callers must pass maxChordErrorMm when sampling arcs for clash checks.
 */
export function samplePathPoints(
  path: CentrePath,
  opts: { maxChordErrorMm: number; lineStepMm?: number },
): Vec2[] {
  const points: Vec2[] = []
  const lineStep = opts.lineStepMm ?? 50

  for (const seg of path.segments) {
    if (seg.kind === 'line') {
      const len = lineLengthMm(seg)
      const steps = Math.max(1, Math.ceil(len / lineStep))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push({
          x: seg.start.x + (seg.end.x - seg.start.x) * t,
          y: seg.start.y + (seg.end.y - seg.start.y) * t,
        })
      }
    } else {
      const r = seg.radiusMm
      // Choose Δθ so R(1 − cos(Δθ/2)) <= maxChordErrorMm
      const err = Math.max(opts.maxChordErrorMm, 1e-9)
      const cosHalf = 1 - err / Math.max(r, 1e-9)
      const clamped = Math.min(1, Math.max(-1, cosHalf))
      const dTheta = 2 * Math.acos(clamped)
      const steps = Math.max(1, Math.ceil(Math.abs(seg.sweepRad) / Math.max(dTheta, 1e-6)))
      for (let i = 0; i <= steps; i++) {
        points.push(arcPoint(seg, i / steps))
      }
    }
  }
  return points
}

/**
 * Horizontal 90° bend centreline arc through a fitting.
 * Port continuity: entry direction +x, exit direction +y (CCW) by convention.
 */
export function horizontal90BendArc(args: {
  entryPoint: Vec2
  centrelineRadiusMm: number
  turn: 'ccw' | 'cw'
}): ArcSegment {
  const r = args.centrelineRadiusMm
  if (!(r > 0)) {
    throw new Error(`Bend centreline radius must be positive, got ${String(r)}`)
  }
  if (args.turn === 'ccw') {
    return {
      kind: 'arc',
      centre: { x: args.entryPoint.x, y: args.entryPoint.y + r },
      radiusMm: r,
      startAngleRad: -Math.PI / 2,
      sweepRad: Math.PI / 2,
    }
  }
  return {
    kind: 'arc',
    centre: { x: args.entryPoint.x, y: args.entryPoint.y - r },
    radiusMm: r,
    startAngleRad: Math.PI / 2,
    sweepRad: -Math.PI / 2,
  }
}

/**
 * Build continuous centre paths through a straight section then a horizontal 90° bend.
 * Cable lateral offsets (cross-section x) are preserved into the bend as parallel arcs
 * (identity/order continuity across the fitting port — brief §4.3).
 */
export function buildStraightThenBendPaths(args: {
  cables: ReadonlyArray<{
    cableInstanceId: string
    /** Cross-section centre x (mm) relative to envelope origin. */
    centreXMm: number
    /** Cross-section centre y (mm). */
    centreYMm: number
  }>
  straightLengthMm: number
  bendCentrelineRadiusMm: number
  turn?: 'ccw' | 'cw'
}): CentrePath[] {
  const turn = args.turn ?? 'ccw'
  return args.cables.map((c) => {
    const start: Vec2 = { x: 0, y: c.centreYMm }
    // Lateral offset applied in plan as parallel path shift along local +y of section,
    // and carried into bend as radius offset from the reference bend radius.
    const entry: Vec2 = { x: args.straightLengthMm, y: c.centreYMm }
    // Preserve lateral centreX as an offset to the bend radius so paths stay continuous
    // without rearranging at the fitting boundary.
    const pathRadius = args.bendCentrelineRadiusMm + c.centreXMm
    const line: LineSegment = { kind: 'line', start, end: entry }
    const arc = horizontal90BendArc({
      entryPoint: entry,
      centrelineRadiusMm: pathRadius,
      turn,
    })
    return {
      cableInstanceId: c.cableInstanceId,
      segments: [line, arc],
    }
  })
}
