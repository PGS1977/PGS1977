import { describe, expect, it } from 'vitest'
import {
  evaluateWeight,
  structuralSupportPanelResult,
  weightAvailableWithDeferredStructural,
} from '../src/engine'

describe('AC16 — structural/support-span deferred; weight available', () => {
  it('panel is NOT_CHECKED and does not issue a structural pass', () => {
    const panel = structuralSupportPanelResult({
      id: 'ac16-panel',
      inputRevisionOrHash: 'test',
      sectionOrFittingId: 'sec-1',
    })

    expect(panel.status).toBe('NOT_CHECKED')
    expect(panel.issueCode).toBe('STRUCTURAL_SUPPORT_DEFERRED')
    expect(panel.check).toBe('structural_support_spans')
    expect(panel.status).not.toBe('PASS')
  })

  it('weight remains available alongside deferred structural status', () => {
    const weight = evaluateWeight({
      cables: [{ cableInstanceId: 'c1', massKgPerM: 2, lengthM: 5 }],
      containmentAndAccessoriesKg: 3,
      containmentMassKnown: true,
    })

    const paired = weightAvailableWithDeferredStructural(weight)
    expect(paired.weight.combinedInstalledKg).toBe(13)
    expect(paired.structuralStatus).toBe('NOT_CHECKED')
  })
})
