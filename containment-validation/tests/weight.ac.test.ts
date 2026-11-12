import { describe, expect, it } from 'vitest'
import { evaluateWeight } from '../src/engine'

describe('AC07 — cable and combined weight', () => {
  it('2 kg/m × 5 m + containment/accessories 3 kg → cable 10, combined 13', () => {
    const result = evaluateWeight({
      cables: [{ cableInstanceId: 'c1', massKgPerM: 2, lengthM: 5 }],
      containmentAndAccessoriesKg: 3,
      containmentMassKnown: true,
    })

    expect(result.totalCableKg).toBe(10)
    expect(result.combinedInstalledKg).toBe(13)
    expect(result.status).toBe('PASS')
    expect(result.issueCode).toBe('WEIGHT_COMPLETE')
  })
})

describe('AC08 — second cable instance in mass', () => {
  it('accounts for both physical cable instances', () => {
    const result = evaluateWeight({
      cables: [
        { cableInstanceId: 'c1', massKgPerM: 2, lengthM: 5 },
        { cableInstanceId: 'c2', massKgPerM: 2, lengthM: 5 },
      ],
      containmentAndAccessoriesKg: 3,
      containmentMassKnown: true,
    })

    expect(result.contributions).toHaveLength(2)
    expect(result.totalCableKg).toBe(20)
    expect(result.combinedInstalledKg).toBe(23)
    expect(result.status).toBe('PASS')
  })
})

describe('AC09 — missing mass is incomplete, never zero', () => {
  it('missing cable mass → INCOMPLETE; known subtotal retained; total null not 0', () => {
    const result = evaluateWeight({
      cables: [
        { cableInstanceId: 'c1', massKgPerM: 2, lengthM: 5 },
        { cableInstanceId: 'c2', massKgPerM: null, lengthM: 5 },
      ],
      containmentAndAccessoriesKg: 3,
      containmentMassKnown: true,
    })

    expect(result.status).toBe('INCOMPLETE')
    expect(result.issueCode).toBe('WEIGHT_MASS_MISSING')
    expect(result.knownCableSubtotalKg).toBe(10)
    expect(result.totalCableKg).toBeNull()
    expect(result.combinedInstalledKg).toBeNull()
    expect(result.totalCableKg).not.toBe(0)
    expect(result.contributions[1]!.contributionKg).toBeNull()
  })

  it('missing containment mass → INCOMPLETE with known cable subtotal', () => {
    const result = evaluateWeight({
      cables: [{ cableInstanceId: 'c1', massKgPerM: 2, lengthM: 5 }],
      containmentAndAccessoriesKg: null,
      containmentMassKnown: false,
    })

    expect(result.status).toBe('INCOMPLETE')
    expect(result.knownCableSubtotalKg).toBe(10)
    expect(result.combinedInstalledKg).toBeNull()
    expect(result.containmentAndAccessoriesKg).toBeNull()
  })
})
