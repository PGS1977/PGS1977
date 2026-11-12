import { describe, expect, it } from 'vitest'
import {
  applyInputChangeKeepingPriorResults,
  buildDemoSnapshot,
  DEFAULT_DEMO_INPUTS,
} from '../src/project/syntheticProject'
import { anyStale, hashInputs, markStaleResults } from '../src/engine'

describe('AC10 — input/rule change marks results stale', () => {
  it('marks prior results STALE when input hash changes', () => {
    const prior = buildDemoSnapshot(DEFAULT_DEMO_INPUTS)
    expect(prior.results.every((r) => r.status !== 'STALE')).toBe(true)

    const nextInputs = {
      ...DEFAULT_DEMO_INPUTS,
      spareTargetPercent: 30,
    }
    const { stalePriorResults, refreshed } = applyInputChangeKeepingPriorResults(
      prior,
      nextInputs,
    )

    expect(refreshed.inputHash).not.toBe(prior.inputHash)
    expect(anyStale(stalePriorResults)).toBe(true)
    expect(
      stalePriorResults.filter((r) => r.inputRevisionOrHash === prior.inputHash),
    ).toHaveLength(prior.results.length)
    expect(stalePriorResults.every((r) => r.status === 'STALE')).toBe(true)
    // Fresh recalculation against new inputs is not stale.
    expect(refreshed.results.every((r) => r.status !== 'STALE')).toBe(true)
  })

  it('leaves matching-hash results unchanged', () => {
    const snap = buildDemoSnapshot(DEFAULT_DEMO_INPUTS)
    const again = markStaleResults(snap.results, snap.inputHash)
    expect(again.every((r) => r.status !== 'STALE')).toBe(true)
    expect(again.map((r) => r.status)).toEqual(snap.results.map((r) => r.status))
  })

  it('hashInputs is stable for identical parts and changes when a rule changes', () => {
    const a = hashInputs([25, 'touching', 190])
    const b = hashInputs([25, 'touching', 190])
    const c = hashInputs([30, 'touching', 190])
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('demo snapshot wires real engines (no simulated pass)', () => {
  it('produces area/arrangement/bend/weight/structural from engines', () => {
    const snap = buildDemoSnapshot(DEFAULT_DEMO_INPUTS)
    expect(snap.provenance).toBe('fixture')
    expect(snap.section.reference).toBe('L01-SM-TR-001')
    expect(snap.fitting.reference).toBe('L01-SM-TR-FT-001')
    expect(snap.arrangement.placements.length).toBe(2)
    expect(snap.bends).toHaveLength(2)
    expect(snap.weight.combinedInstalledKg).not.toBeNull()
    expect(snap.structural.status).toBe('NOT_CHECKED')
    expect(snap.geometry.envelope.kind).toBe('validation_envelope')
    expect(snap.geometry.mesh.kind).toBe('render_mesh')
    // Usable envelope is synthetic 190×44 — not a hard-coded 150/300 outcome.
    expect(snap.inputs.usableWidthMm).toBe(190)
    expect(snap.inputs.usableWidthMm).not.toBe(150)
    expect(snap.inputs.usableWidthMm).not.toBe(300)
  })
})
