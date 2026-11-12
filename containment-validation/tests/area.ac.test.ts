import { describe, expect, it } from 'vitest'
import {
  evaluateSpareArea,
  unionAreaMm2,
  type Rect,
} from '../src/engine'

/**
 * AC01–AC03: synthetic areas only — not product geometry (brief §9).
 */

describe('AC01 — spare exactly 25% passes', () => {
  it('net 10000 mm², cables 7500 mm², target 25% → spare 25%, PASS', () => {
    const result = evaluateSpareArea({
      envelopeAreaMm2: 10_000,
      cableAreasMm2: [7500],
      spareTargetPercent: 25,
    })

    expect(result.netAreaMm2).toBe(10_000)
    expect(result.cableAreaSumMm2).toBe(7500)
    expect(result.sparePercent).toBe(25)
    expect(result.status).toBe('PASS')
    expect(result.issueCode).toBe('AREA_TARGET_MET')
  })
})

describe('AC02 — obstruction reduces spare below target', () => {
  it('envelope 10000, obstruction union 1000, cables 7000 → spare 22.222…%, ERROR', () => {
    const result = evaluateSpareArea({
      envelopeAreaMm2: 10_000,
      // Precomputed union area for this synthetic case (AC02).
      obstructionAreasMm2: [1000],
      cableAreasMm2: [7000],
      spareTargetPercent: 25,
    })

    expect(result.obstructionUnionMm2).toBe(1000)
    expect(result.netAreaMm2).toBe(9000)
    expect(result.sparePercent).toBeCloseTo((100 * (9000 - 7000)) / 9000, 12)
    expect(result.sparePercent).toBeCloseTo(22.22222222222222, 10)
    // Unrounded comparison fails 25% target.
    expect(result.sparePercent! < 25).toBe(true)
    expect(result.status).toBe('ERROR')
    expect(result.issueCode).toBe('AREA_TARGET_NOT_MET')
  })
})

describe('AC03 — overlapping obstruction records deduct union once', () => {
  it('two identical overlapping rects → union area equals one rect', () => {
    const rect: Rect = { xMm: 0, yMm: 0, widthMm: 50, heightMm: 20 }
    const single = unionAreaMm2([rect])
    const duplicated = unionAreaMm2([rect, { ...rect }])

    expect(single).toBe(1000)
    expect(duplicated).toBe(1000)

    const result = evaluateSpareArea({
      envelopeAreaMm2: 10_000,
      obstructionRects: [rect, { ...rect }],
      cableAreasMm2: [7000],
      spareTargetPercent: 25,
    })

    expect(result.obstructionUnionMm2).toBe(1000)
    expect(result.netAreaMm2).toBe(9000)
    expect(result.sparePercent).toBeCloseTo(22.22222222222222, 10)
    expect(result.status).toBe('ERROR')
  })

  it('partially overlapping rects union correctly', () => {
    const a: Rect = { xMm: 0, yMm: 0, widthMm: 100, heightMm: 100 }
    const b: Rect = { xMm: 50, yMm: 50, widthMm: 100, heightMm: 100 }
    // Union = 10000 + 10000 - 2500 = 17500
    expect(unionAreaMm2([a, b])).toBe(17_500)
  })
})

describe('AC08 (area portion) — second cable instance counted', () => {
  it('two physical cable areas are summed', () => {
    const one = evaluateSpareArea({
      envelopeAreaMm2: 10_000,
      cableAreasMm2: [3000],
      spareTargetPercent: 25,
    })
    const two = evaluateSpareArea({
      envelopeAreaMm2: 10_000,
      cableAreasMm2: [3000, 3000],
      spareTargetPercent: 25,
    })

    expect(one.cableAreaSumMm2).toBe(3000)
    expect(two.cableAreaSumMm2).toBe(6000)
    expect(two.sparePercent).toBe(40)
    expect(two.sparePercent).not.toBe(one.sparePercent)
  })
})

describe('AC09 (area portion) — missing envelope → INCOMPLETE', () => {
  it('does not invent envelope or pass', () => {
    const result = evaluateSpareArea({
      envelopeAreaMm2: null,
      cableAreasMm2: [1000],
      spareTargetPercent: 25,
    })
    expect(result.status).toBe('INCOMPLETE')
    expect(result.issueCode).toBe('AREA_ENVELOPE_MISSING')
    expect(result.sparePercent).toBeNull()
  })
})
