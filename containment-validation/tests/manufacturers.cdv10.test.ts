import { describe, expect, it } from 'vitest'
import {
  ALL_KNOWN_PRODUCT_SOURCES,
  DesignBasisSchema,
  defaultDesignBasisFromInputs,
} from '../src/storage'
import {
  assertBiccLvOnly,
  filterSourcesByManufacturerIds,
  KNOWN_MANUFACTURERS,
  manufacturersForKind,
  ProductSourceSchema,
  parseOrThrow,
  toggleManufacturerId,
} from '../src/domain'
import { DEFAULT_DEMO_INPUTS } from '../src/project/syntheticProject'

describe('CDV-10 manufacturer selection', () => {
  it('registers multi-manufacturer cable and containment makers', () => {
    const cableIds = manufacturersForKind('cable').map((m) => m.id)
    const containmentIds = manufacturersForKind('containment').map((m) => m.id)
    expect(cableIds).toEqual(
      expect.arrayContaining(['synthetic', 'bicc', 'cleveland']),
    )
    expect(containmentIds).toEqual(
      expect.arrayContaining(['synthetic', 'cablofil', 'swifts']),
    )
    expect(KNOWN_MANUFACTURERS.some((m) => m.id === 'bicc')).toBe(true)
  })

  it('marks BICC as LV-only and never Overhead Line', () => {
    const bicc = KNOWN_MANUFACTURERS.find((m) => m.id === 'bicc')
    expect(bicc?.constraints).toEqual(
      expect.arrayContaining(['LV_ONLY', 'NEVER_OVERHEAD_LINE']),
    )
    expect(bicc?.structuredStatus).toBe('incomplete')
    expect(assertBiccLvOnly({ manufacturerId: 'bicc', familyOrType: 'LV SWA' }).ok).toBe(
      true,
    )
    expect(
      assertBiccLvOnly({
        manufacturerId: 'bicc',
        familyOrType: 'Overhead Line AAAC',
      }).ok,
    ).toBe(false)
    expect(
      assertBiccLvOnly({ manufacturerId: 'cleveland', familyOrType: 'overhead' })
        .ok,
    ).toBe(true)
  })

  it('filters product sources by selected manufacturer ids', () => {
    const filtered = filterSourcesByManufacturerIds(
      ALL_KNOWN_PRODUCT_SOURCES,
      ['cleveland', 'cablofil'],
    )
    expect(filtered.map((s) => s.manufacturerId).sort()).toEqual([
      'cablofil',
      'cleveland',
    ])
    const cablesOnly = filterSourcesByManufacturerIds(
      ALL_KNOWN_PRODUCT_SOURCES,
      ['synthetic', 'bicc', 'cleveland'],
      'cable',
    )
    expect(cablesOnly.every((s) => s.productKind === 'cable')).toBe(true)
    expect(cablesOnly.some((s) => s.manufacturerId === 'swifts')).toBe(false)
  })

  it('toggles manufacturer selection without single-supplier lock-in', () => {
    expect(toggleManufacturerId(['synthetic'], 'cleveland')).toEqual([
      'synthetic',
      'cleveland',
    ])
    expect(toggleManufacturerId(['synthetic', 'cleveland'], 'synthetic')).toEqual([
      'cleveland',
    ])
  })

  it('default design basis selects fixtures and lists all known sources', () => {
    const basis = defaultDesignBasisFromInputs(DEFAULT_DEMO_INPUTS)
    expect(basis.selectedCableManufacturerIds).toEqual(['synthetic'])
    expect(basis.selectedContainmentManufacturerIds).toEqual(['synthetic'])
    expect(basis.productSources.length).toBeGreaterThanOrEqual(6)
    expect(basis.catalogueState).toBe('incomplete')
    const parsed = DesignBasisSchema.parse(basis)
    expect(parsed.selectedCableManufacturerIds).toContain('synthetic')
  })

  it('keeps incomplete raw catalogue sources from claiming verified status', () => {
    for (const source of ALL_KNOWN_PRODUCT_SOURCES) {
      const parsed = parseOrThrow(ProductSourceSchema, {
        schemaVersion: '1.0.0',
        ...source,
      }, 'ProductSource')
      if (parsed.manufacturerId !== 'synthetic') {
        expect(parsed.structuredDataStatus).toBe('incomplete')
        expect(parsed.provenance).not.toBe('verified')
      } else {
        expect(parsed.provenance).toBe('fixture')
        expect(parsed.structuredDataStatus).toBe('fixture')
      }
    }
  })

  it('parses legacy design basis without selection fields via defaults', () => {
    const legacy = {
      displayUnits: 'metric',
      spareTargetPercent: 25,
      arrangementMode: 'touching',
      productSources: [
        {
          id: 'fixture-source-cable',
          manufacturer: 'SYNTHETIC',
          sourceFileOrReference: 'data/fixtures/cable-products.json',
          revision: 'fixture-2026-11-12',
          provenance: 'fixture',
        },
      ],
      assumptions: [],
      catalogueState: 'incomplete',
    }
    const parsed = DesignBasisSchema.parse(legacy)
    expect(parsed.selectedCableManufacturerIds).toEqual(['synthetic'])
    expect(parsed.selectedContainmentManufacturerIds).toEqual(['synthetic'])
    expect(parsed.productSources[0]?.manufacturerId).toBe('synthetic')
  })
})
