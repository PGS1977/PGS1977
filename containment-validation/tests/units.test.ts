import { describe, expect, it } from 'vitest'
import {
  AmbiguousUnitError,
  kgPerKmToKgPerM,
  massPerLengthToKgPerM,
  parseOrThrow,
  ProductSourceSchema,
  ProjectSchema,
  SectionReferenceSchema,
  FittingReferenceSchema,
  RESULT_STATUS,
  PROVENANCE,
} from '../src/domain'

describe('units — kg/km → kg/m', () => {
  it('divides by 1000', () => {
    expect(kgPerKmToKgPerM(2500)).toBe(2.5)
    expect(massPerLengthToKgPerM(2500, 'kg/km')).toBe(2.5)
    expect(massPerLengthToKgPerM(2.5, 'kg/m')).toBe(2.5)
  })

  it('rejects ambiguous unit labels', () => {
    expect(() => massPerLengthToKgPerM(1, 'kg')).toThrow(AmbiguousUnitError)
    expect(() => massPerLengthToKgPerM(1, 'lb/ft')).toThrow(AmbiguousUnitError)
  })
})

describe('schemas — runtime validation', () => {
  it('parses a fixture product source', () => {
    const source = parseOrThrow(
      ProductSourceSchema,
      {
        id: 'src-fixture-1',
        manufacturer: 'SYNTHETIC',
        sourceFileOrReference: 'data/fixtures/README.md',
        revision: 'fixture-1',
        provenance: PROVENANCE.fixture,
      },
      'ProductSource',
    )
    expect(source.provenance).toBe('fixture')
  })

  it('parses project with default 25% spare target', () => {
    const project = parseOrThrow(
      ProjectSchema,
      {
        id: 'proj-1',
        projectNumber: 'P-001',
        name: 'Demo',
        revision: 'A',
      },
      'Project',
    )
    expect(project.ruleSettings.spareTargetPercent).toBe(25)
  })

  it('validates section and fitting references', () => {
    expect(SectionReferenceSchema.parse('L01-SM-TR-001')).toBe('L01-SM-TR-001')
    expect(FittingReferenceSchema.parse('L01-SM-TR-FT-001')).toBe(
      'L01-SM-TR-FT-001',
    )
    expect(() => SectionReferenceSchema.parse('BAD')).toThrow()
  })

  it('exposes required result statuses', () => {
    expect(Object.values(RESULT_STATUS).sort()).toEqual(
      ['ERROR', 'INCOMPLETE', 'NOT_CHECKED', 'PASS', 'STALE'].sort(),
    )
  })
})
