import { describe, expect, it } from 'vitest'
import { createNewFixtureProject } from '../src/project/newProject'
import { DEFAULT_DEMO_INPUTS } from '../src/project/syntheticProject'
import {
  MemoryProjectLibrary,
  createProjectDocument,
  defaultDesignBasisFromInputs,
  exportProjectJson,
  importProjectJson,
  reopenProjectDocument,
} from '../src/storage'

describe('AC11 — save / reopen / export identical IDs, inputs, placements, numerics', () => {
  it('JSON export → import preserves project document evidence', () => {
    const original = createNewFixtureProject({
      name: 'Round-trip fixture',
      projectNumber: 'PGS-AC11-001',
    })
    const json = exportProjectJson(original)
    const imported = importProjectJson(json)

    expect(imported.project.id).toBe(original.project.id)
    expect(imported.project.projectNumber).toBe(original.project.projectNumber)
    expect(imported.calculationInputs).toEqual(original.calculationInputs)
    expect(imported.evidence.section.id).toBe(original.evidence.section.id)
    expect(imported.evidence.fitting.id).toBe(original.evidence.fitting.id)
    expect(imported.evidence.cableIds).toEqual(original.evidence.cableIds)
    expect(imported.evidence.placements).toEqual(original.evidence.placements)
    expect(imported.evidence.area).toEqual(original.evidence.area)
    expect(imported.evidence.weight).toEqual(original.evidence.weight)
    expect(imported.evidence.bends).toEqual(original.evidence.bends)
    expect(imported.evidence.resultIds).toEqual(original.evidence.resultIds)
    expect(imported.evidence.inputHash).toBe(original.evidence.inputHash)
  })

  it('reopen recomputes identical placements and numeric results', () => {
    const doc = createProjectDocument({
      project: {
        id: 'proj-ac11',
        projectNumber: 'PGS-AC11-002',
        name: 'Reopen check',
        revision: 'A',
        displayUnits: 'metric',
      },
      designBasis: defaultDesignBasisFromInputs(DEFAULT_DEMO_INPUTS),
      calculationInputs: DEFAULT_DEMO_INPUTS,
      updatedAt: '2026-11-12T00:00:00.000Z',
    })

    const { identical, mismatches, recomputed } = reopenProjectDocument(doc)
    expect(mismatches).toEqual([])
    expect(identical).toBe(true)
    expect(recomputed.evidence.placements).toEqual(doc.evidence.placements)
    expect(recomputed.evidence.area.sparePercent).toBe(doc.evidence.area.sparePercent)
    expect(recomputed.evidence.weight.combinedInstalledKg).toBe(
      doc.evidence.weight.combinedInstalledKg,
    )
  })

  it('memory library save → get → export round-trips', async () => {
    const library = new MemoryProjectLibrary()
    const created = createNewFixtureProject({ projectNumber: 'PGS-AC11-003' })
    await library.save(created)
    const loaded = await library.get(created.project.id)
    expect(loaded).not.toBeNull()
    const exported = await library.exportJson(created.project.id)
    const reimported = await library.importJson(exported)
    expect(reimported.project.id).toBe(created.project.id)
    expect(reimported.evidence.placements).toEqual(created.evidence.placements)
    expect(reimported.evidence.resultIds).toEqual(created.evidence.resultIds)
  })

  it('keeps fixture provenance and incomplete catalogue state', () => {
    const doc = createNewFixtureProject()
    expect(doc.designBasis.catalogueState).toBe('incomplete')
    const fixtures = doc.designBasis.productSources.filter(
      (s) => s.manufacturerId === 'synthetic',
    )
    expect(fixtures.length).toBeGreaterThan(0)
    expect(fixtures.every((s) => s.provenance === 'fixture')).toBe(true)
    expect(
      doc.designBasis.productSources.every((s) => s.provenance !== 'verified'),
    ).toBe(true)
    expect(doc.designBasis.selectedCableManufacturerIds).toContain('synthetic')
    expect(doc.calculationInputs.usableWidthMm).not.toBe(150)
    expect(doc.calculationInputs.usableWidthMm).not.toBe(300)
  })
})
