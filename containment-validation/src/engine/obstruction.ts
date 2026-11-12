/**
 * Geometric union of axis-aligned obstruction rectangles (brief §4.2).
 * Overlapping areas are counted once (AC03).
 */

import type { RectMm } from '../domain/schemas'

export type Rect = RectMm

/** Area of a single axis-aligned rectangle in mm². */
export function rectAreaMm2(rect: Rect): number {
  return rect.widthMm * rect.heightMm
}

/**
 * Union area of axis-aligned rectangles via sweep-line / discretised strip merge.
 * Exact for axis-aligned rectangles (no sampling tolerance).
 */
export function unionAreaMm2(rects: readonly Rect[]): number {
  if (rects.length === 0) return 0

  const events: Array<{ x: number; y1: number; y2: number; type: 1 | -1 }> = []
  for (const r of rects) {
    const x1 = r.xMm
    const x2 = r.xMm + r.widthMm
    const y1 = r.yMm
    const y2 = r.yMm + r.heightMm
    if (x2 <= x1 || y2 <= y1) continue
    events.push({ x: x1, y1, y2, type: 1 })
    events.push({ x: x2, y1, y2, type: -1 })
  }
  if (events.length === 0) return 0

  events.sort((a, b) => a.x - b.x || b.type - a.type)

  const active: Array<{ y1: number; y2: number }> = []
  let area = 0
  let prevX = events[0]!.x

  const coveredYLength = (): number => {
    if (active.length === 0) return 0
    const sorted = [...active].sort((a, b) => a.y1 - b.y1)
    let total = 0
    let curStart = sorted[0]!.y1
    let curEnd = sorted[0]!.y2
    for (let i = 1; i < sorted.length; i++) {
      const seg = sorted[i]!
      if (seg.y1 <= curEnd) {
        curEnd = Math.max(curEnd, seg.y2)
      } else {
        total += curEnd - curStart
        curStart = seg.y1
        curEnd = seg.y2
      }
    }
    total += curEnd - curStart
    return total
  }

  for (const ev of events) {
    const dx = ev.x - prevX
    if (dx > 0) {
      area += dx * coveredYLength()
    }
    if (ev.type === 1) {
      active.push({ y1: ev.y1, y2: ev.y2 })
    } else {
      const idx = active.findIndex(
        (s) => s.y1 === ev.y1 && s.y2 === ev.y2,
      )
      if (idx >= 0) active.splice(idx, 1)
    }
    prevX = ev.x
  }

  return area
}

/**
 * Resolve obstruction intrusion area for a set of fixings.
 * Prefer geometric union of intrusionRectMm; fall back to summing
 * non-overlapping scalar intrusionAreaMm2 only when no rects exist.
 * Returns null when a fixing is present but has neither geometry nor area
 * (missing fixing geometry → incomplete).
 */
export function resolveObstructionUnionMm2(
  fixings: ReadonlyArray<{
    intrusionRectMm?: Rect | undefined
    intrusionAreaMm2?: number | undefined
  }>,
): { areaMm2: number; missingGeometry: boolean } {
  if (fixings.length === 0) {
    return { areaMm2: 0, missingGeometry: false }
  }

  const rects = fixings
    .map((f) => f.intrusionRectMm)
    .filter((r): r is Rect => r != null)

  const missingGeometry = fixings.some(
    (f) => f.intrusionRectMm == null && f.intrusionAreaMm2 == null,
  )

  if (rects.length > 0) {
    // When any rects exist, union those. Scalars without rects cannot be
    // geometrically merged; treat as missingGeometry if mixed.
    const scalarsWithoutRect = fixings.some(
      (f) => f.intrusionRectMm == null && f.intrusionAreaMm2 != null,
    )
    return {
      areaMm2: unionAreaMm2(rects),
      missingGeometry: missingGeometry || scalarsWithoutRect,
    }
  }

  // Scalar-only path (synthetic area tests may supply precomputed areas).
  // Without geometry, overlapping scalars cannot be unioned — callers that
  // need AC03 must supply rectangles. Sum is used only when all are scalars
  // and the caller accepts that limitation for non-overlapping cases.
  let sum = 0
  for (const f of fixings) {
    if (f.intrusionAreaMm2 != null) sum += f.intrusionAreaMm2
  }
  return { areaMm2: sum, missingGeometry }
}
