import { describe, expect, it } from 'vitest'
import {
  buildStraightThenBendPaths,
  evaluateBendRadius,
  minAchievedCentrelineRadiusMm,
  requiredRadiusToCentrelineMm,
  samplePathPoints,
} from '../src/engine'

describe('AC05 — achieved 299 mm vs required 300 mm → bend error', () => {
  it('fails without display-rounding pass; message is mandated wording', () => {
    const result = evaluateBendRadius({
      cableInstanceId: 'c1',
      achievedCentrelineRadiusMm: 299,
      requiredRadiusMm: 300,
      requiredConvention: 'centreline',
      outsideDiameterMm: 30,
    })

    expect(result.status).toBe('ERROR')
    expect(result.issueCode).toBe('BEND_RADIUS_NOT_MET')
    expect(result.message).toBe('Minimum bend radius not met')
    // Unrounded: 299 must not pass.
    expect(result.achievedCentrelineRadiusMm).toBe(299)
    expect(result.requiredCentrelineRadiusMm).toBe(300)
  })
})

describe('AC06 — required and achieved both 300 mm, same convention', () => {
  it('passes radius check independently of other checks', () => {
    const result = evaluateBendRadius({
      cableInstanceId: 'c1',
      achievedCentrelineRadiusMm: 300,
      requiredRadiusMm: 300,
      requiredConvention: 'centreline',
      outsideDiameterMm: 30,
    })

    expect(result.status).toBe('PASS')
    expect(result.issueCode).toBe('BEND_RADIUS_OK')
    expect(result.message).toBe('Minimum bend radius met')
  })
})

describe('AC09 (bend portion) — missing manufacturer radius → INCOMPLETE', () => {
  it('does not invent a required radius', () => {
    const result = evaluateBendRadius({
      cableInstanceId: 'c-incomplete',
      achievedCentrelineRadiusMm: 400,
      requiredRadiusMm: null,
      requiredConvention: null,
      outsideDiameterMm: 28,
    })
    expect(result.status).toBe('INCOMPLETE')
    expect(result.issueCode).toBe('BEND_RADIUS_DATA_MISSING')
  })
})

describe('bend convention conversion', () => {
  it('converts inner-surface requirement to centreline using OD/2', () => {
    const centreline = requiredRadiusToCentrelineMm({
      requiredRadiusMm: 300,
      convention: 'inner_surface',
      outsideDiameterMm: 40,
    })
    expect(centreline).toBe(320)
  })
})

describe('path continuity through straight + horizontal 90°', () => {
  it('preserves cable identity and exposes achieved arc radius', () => {
    const paths = buildStraightThenBendPaths({
      cables: [
        { cableInstanceId: 'c1', centreXMm: 0, centreYMm: 20 },
        { cableInstanceId: 'c2', centreXMm: 30, centreYMm: 20 },
      ],
      straightLengthMm: 1000,
      bendCentrelineRadiusMm: 400,
    })

    expect(paths.map((p) => p.cableInstanceId)).toEqual(['c1', 'c2'])
    expect(minAchievedCentrelineRadiusMm(paths[0]!)).toBe(400)
    // Parallel path offset increases radius for c2 (continuity without rearrange).
    expect(minAchievedCentrelineRadiusMm(paths[1]!)).toBe(430)

    const samples = samplePathPoints(paths[0]!, { maxChordErrorMm: 0.5 })
    expect(samples.length).toBeGreaterThan(10)
  })
})
