import { describe, expect, it } from 'vitest'
import {
  arrangeCables,
  evaluateAreaAndArrangement,
  evaluateLocalRestrictions,
  evaluateSpareArea,
  UNEQUAL_DIAMETER_SPACING_ASSUMPTION,
} from '../src/engine'

/**
 * Synthetic envelopes only — not manufacturer product geometry.
 * Intentionally avoid 150/300 mm nominal widths as pass/fail keys.
 */

describe('AC04 — area passes but spacing fails → fit error, no overall pass', () => {
  it('reports OVERALL_FIT_ERROR when spare met but spaced arrangement cannot fit', () => {
    // Area: envelope large enough for cable CSA vs 25% spare.
    // Two Ø40 cables occupy 2 * π*20² = 2513.27… mm²; envelope 10000 → spare ~74.9%.
    const cables = [
      { cableInstanceId: 'c1', outsideDiameterMm: 40 },
      { cableInstanceId: 'c2', outsideDiameterMm: 40 },
    ]
    const area = {
      envelopeAreaMm2: 10_000,
      cableDiametersMm: [40, 40],
      spareTargetPercent: 25,
    }
    const areaOnly = evaluateSpareArea(area)
    expect(areaOnly.status).toBe('PASS')

    // Usable envelope too narrow for 2D spacing: need D + 2D + D = 4D = 160 mm width.
    const overall = evaluateAreaAndArrangement({
      area,
      cables,
      envelope: { widthMm: 100, heightMm: 80 },
      arrangement: {
        mode: 'spaced',
        spacedMultiplier: 2,
        searchLimit: 8,
      },
    })

    expect(overall.area.status).toBe('PASS')
    expect(overall.arrangement.status).toBe('ERROR')
    expect(overall.status).toBe('ERROR')
    expect(overall.status).not.toBe('PASS')
    expect(overall.issueCode).toBe('OVERALL_FIT_ERROR')
    expect(overall.evidence).toMatch(/arrangement\/spacing failed/i)
  })
})

describe('AC14 — search limit reached', () => {
  it('returns ERROR_NO_VALID_ARRANGEMENT_FOUND without claiming impossibility', () => {
    const result = arrangeCables({
      cables: [
        { cableInstanceId: 'a', outsideDiameterMm: 50 },
        { cableInstanceId: 'b', outsideDiameterMm: 50 },
        { cableInstanceId: 'c', outsideDiameterMm: 50 },
      ],
      // Far too small for three Ø50 cables with 1D spacing.
      envelope: { widthMm: 90, heightMm: 60 },
      settings: {
        mode: 'spaced',
        spacedMultiplier: 1,
        searchLimit: 5,
      },
    })

    expect(result.status).toBe('ERROR')
    expect(result.issueCode).toBe('ERROR_NO_VALID_ARRANGEMENT_FOUND')
    expect(result.searchAttempts).toBe(5)
    expect(result.searchLimit).toBe(5)
    expect(result.evidence).toMatch(/within search limit/i)
    expect(result.evidence).toMatch(/does not prove mathematical impossibility/i)
  })
})

describe('AC08 (arrangement) — both physical cables placed', () => {
  it('places two cables in a touching arrangement reproducibly', () => {
    const first = arrangeCables({
      cables: [
        { cableInstanceId: 'c2', outsideDiameterMm: 20 },
        { cableInstanceId: 'c1', outsideDiameterMm: 20 },
      ],
      envelope: { widthMm: 200, heightMm: 80 },
      settings: { mode: 'touching', searchLimit: 8 },
    })
    const second = arrangeCables({
      cables: [
        { cableInstanceId: 'c1', outsideDiameterMm: 20 },
        { cableInstanceId: 'c2', outsideDiameterMm: 20 },
      ],
      envelope: { widthMm: 200, heightMm: 80 },
      settings: { mode: 'touching', searchLimit: 8 },
    })

    expect(first.status).toBe('PASS')
    expect(first.placements).toHaveLength(2)
    expect(second.placements.map((p) => p.cableInstanceId)).toEqual(
      first.placements.map((p) => p.cableInstanceId),
    )
    expect(second.placements.map((p) => p.centreXMm)).toEqual(
      first.placements.map((p) => p.centreXMm),
    )
  })

  it('flags AS01 unequal-diameter spacing assumption for spaced mode', () => {
    const result = arrangeCables({
      cables: [
        { cableInstanceId: 'c1', outsideDiameterMm: 20 },
        { cableInstanceId: 'c2', outsideDiameterMm: 30 },
      ],
      envelope: { widthMm: 220, heightMm: 80 },
      settings: { mode: 'spaced', spacedMultiplier: 1, searchLimit: 8 },
    })
    expect(result.status).toBe('PASS')
    expect(result.spacingReferenceMm).toBe(30)
    expect(result.requiredClearGapMm).toBe(30)
    expect(result.assumptions).toContain(UNEQUAL_DIAMETER_SPACING_ASSUMPTION)
  })
})

describe('AC15 — local cleat restriction governs', () => {
  it('reports governing local sample when clear span passes but cleat station fails', () => {
    const cables = [
      { cableInstanceId: 'c1', outsideDiameterMm: 25 },
      { cableInstanceId: 'c2', outsideDiameterMm: 25 },
    ]
    const envelope = { widthMm: 120, heightMm: 60 }
    const baseArea = {
      envelopeAreaMm2: 7200,
      cableDiametersMm: [25, 25],
      spareTargetPercent: 25,
    }

    const report = evaluateLocalRestrictions([
      {
        sampleId: 'clear-midspan',
        locationNote: 'clear span',
        area: baseArea,
        cables,
        envelope,
        arrangement: { mode: 'touching', searchLimit: 8 },
        obstacles: [],
      },
      {
        sampleId: 'cleat-station',
        locationNote: 'local cleat intrusion',
        area: {
          ...baseArea,
          // Cleat eats area but spare can still pass; fit fails on geometry.
          obstructionRects: [
            { xMm: 40, yMm: 0, widthMm: 40, heightMm: 60 },
          ],
        },
        cables,
        envelope,
        arrangement: { mode: 'touching', searchLimit: 8 },
        obstacles: [{ xMm: 40, yMm: 0, widthMm: 40, heightMm: 60 }],
      },
    ])

    expect(report.samples).toHaveLength(2)
    expect(report.samples[0]!.overall.status).toBe('PASS')
    expect(report.samples[1]!.overall.status).toBe('ERROR')
    expect(report.status).toBe('ERROR')
    expect(report.issueCode).toBe('LOCAL_RESTRICTION_GOVERNING')
    expect(report.governingSampleId).toBe('cleat-station')
    expect(report.evidence).toMatch(/cleat-station/)
  })
})

describe('stacked arrangement requires explicit inputs', () => {
  it('returns INCOMPLETE when layer count / vertical gap omitted', () => {
    const result = arrangeCables({
      cables: [
        { cableInstanceId: 'c1', outsideDiameterMm: 20 },
        { cableInstanceId: 'c2', outsideDiameterMm: 20 },
      ],
      envelope: { widthMm: 100, heightMm: 100 },
      settings: { mode: 'stacked', searchLimit: 4 },
    })
    expect(result.status).toBe('INCOMPLETE')
    expect(result.issueCode).toBe('ARRANGEMENT_INPUT_INCOMPLETE')
  })

  it('places stacked cables when layer inputs are explicit', () => {
    const result = arrangeCables({
      cables: [
        { cableInstanceId: 'c1', outsideDiameterMm: 20 },
        { cableInstanceId: 'c2', outsideDiameterMm: 20 },
        { cableInstanceId: 'c3', outsideDiameterMm: 20 },
        { cableInstanceId: 'c4', outsideDiameterMm: 20 },
      ],
      envelope: { widthMm: 100, heightMm: 100 },
      settings: {
        mode: 'stacked',
        stackedLayerCount: 2,
        stackedVerticalGapMm: 5,
        searchLimit: 8,
      },
    })
    expect(result.status).toBe('PASS')
    expect(result.placements).toHaveLength(4)
    const ys = new Set(result.placements.map((p) => p.centreYMm))
    expect(ys.size).toBe(2)
  })
})
