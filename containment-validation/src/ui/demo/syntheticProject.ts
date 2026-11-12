/**
 * Synthetic demo project for Increment D linked views.
 * All geometry/mass values are fixtures — not manufacturer-verified.
 */

import {
  PROVENANCE,
  RESULT_STATUS,
  type ValidationResult,
} from '../../domain'
import {
  arrangeCables,
  buildStraightThenBendPaths,
  evaluateBendRadius,
  evaluateSpareArea,
  evaluateWeight,
  hashInputs,
  markStaleResults,
  minAchievedCentrelineRadiusMm,
  structuralSupportPanelResult,
  type ArrangementResult,
  type BendCheckResult,
  type SpareAreaResult,
  type WeightResult,
} from '../../engine'
import { trayRenderMeshFromEnvelope } from '../../render'

export const DEMO_CALCULATION_VERSION = 'demo-workspace-1.0.0' as const

export type DemoCable = {
  id: string
  reference: string
  outsideDiameterMm: number
  massKgPerM: number
  requiredBendRadiusMm: number
  bendConvention: 'centreline'
}

export type DemoProjectInputs = {
  spareTargetPercent: number
  arrangementMode: 'touching' | 'spaced'
  spacedMultiplier: number
  usableWidthMm: number
  usableHeightMm: number
  straightLengthMm: number
  bendRadiusMm: number
  containmentMassKg: number
  cables: DemoCable[]
}

export type DemoProjectSnapshot = {
  provenance: typeof PROVENANCE.fixture
  section: { id: string; reference: string; lengthM: number }
  fitting: { id: string; reference: string; kind: 'horizontal_90' }
  inputs: DemoProjectInputs
  inputHash: string
  geometry: ReturnType<typeof trayRenderMeshFromEnvelope>
  area: SpareAreaResult
  arrangement: ArrangementResult
  bends: BendCheckResult[]
  weight: WeightResult
  structural: ValidationResult
  results: ValidationResult[]
  paths: ReturnType<typeof buildStraightThenBendPaths>
}

export const DEFAULT_DEMO_INPUTS: DemoProjectInputs = {
  spareTargetPercent: 25,
  arrangementMode: 'touching',
  spacedMultiplier: 1,
  // Synthetic usable envelope — not 150/300 mm hard-coded outcomes.
  usableWidthMm: 190,
  usableHeightMm: 44,
  straightLengthMm: 2000,
  bendRadiusMm: 400,
  containmentMassKg: 3,
  cables: [
    {
      id: 'cable-synth-a',
      reference: 'SYNTH-CAB-A',
      outsideDiameterMm: 28,
      massKgPerM: 1.15,
      requiredBendRadiusMm: 280,
      bendConvention: 'centreline',
    },
    {
      id: 'cable-synth-b',
      reference: 'SYNTH-CAB-B',
      outsideDiameterMm: 28,
      massKgPerM: 1.15,
      requiredBendRadiusMm: 280,
      bendConvention: 'centreline',
    },
  ],
}

export function computeInputHash(inputs: DemoProjectInputs): string {
  return hashInputs([
    inputs.spareTargetPercent,
    inputs.arrangementMode,
    inputs.spacedMultiplier,
    inputs.usableWidthMm,
    inputs.usableHeightMm,
    inputs.straightLengthMm,
    inputs.bendRadiusMm,
    inputs.containmentMassKg,
    ...inputs.cables.flatMap((c) => [
      c.id,
      c.outsideDiameterMm,
      c.massKgPerM,
      c.requiredBendRadiusMm,
    ]),
  ])
}

function toValidationResult(
  partial: Omit<ValidationResult, 'schemaVersion' | 'productDataRevisions'> & {
    productDataRevisions?: string[]
  },
): ValidationResult {
  return {
    schemaVersion: '1.0.0',
    productDataRevisions: partial.productDataRevisions ?? ['fixture-2026-11-12'],
    ...partial,
  }
}

/** Run pure engines against synthetic inputs and assemble linked-view snapshot. */
export function buildDemoSnapshot(inputs: DemoProjectInputs): DemoProjectSnapshot {
  const inputHash = computeInputHash(inputs)
  const geometry = trayRenderMeshFromEnvelope({
    usableWidthMm: inputs.usableWidthMm,
    usableHeightMm: inputs.usableHeightMm,
  })

  const placementCables = inputs.cables.map((c) => ({
    cableInstanceId: c.id,
    outsideDiameterMm: c.outsideDiameterMm,
  }))

  const area = evaluateSpareArea({
    envelopeAreaMm2: inputs.usableWidthMm * inputs.usableHeightMm,
    cableDiametersMm: inputs.cables.map((c) => c.outsideDiameterMm),
    spareTargetPercent: inputs.spareTargetPercent,
  })

  const arrangement = arrangeCables({
    cables: placementCables,
    envelope: {
      widthMm: inputs.usableWidthMm,
      heightMm: inputs.usableHeightMm,
    },
    settings: {
      mode: inputs.arrangementMode,
      spacedMultiplier: inputs.spacedMultiplier,
      searchLimit: 32,
    },
  })

  const placed =
    arrangement.status === RESULT_STATUS.PASS
      ? arrangement.placements
      : inputs.cables.map((c, i) => ({
          cableInstanceId: c.id,
          outsideDiameterMm: c.outsideDiameterMm,
          centreXMm: 20 + i * 40,
          centreYMm: inputs.usableHeightMm / 2,
        }))

  const paths = buildStraightThenBendPaths({
    cables: placed.map((p) => ({
      cableInstanceId: p.cableInstanceId,
      centreXMm: p.centreXMm - inputs.usableWidthMm / 2,
      centreYMm: p.centreYMm,
    })),
    straightLengthMm: inputs.straightLengthMm,
    bendCentrelineRadiusMm: inputs.bendRadiusMm,
  })

  const bends = inputs.cables.map((c) => {
    const path = paths.find((p) => p.cableInstanceId === c.id)
    return evaluateBendRadius({
      cableInstanceId: c.id,
      achievedCentrelineRadiusMm: path
        ? minAchievedCentrelineRadiusMm(path)
        : inputs.bendRadiusMm,
      requiredRadiusMm: c.requiredBendRadiusMm,
      requiredConvention: c.bendConvention,
      outsideDiameterMm: c.outsideDiameterMm,
    })
  })

  const sectionLengthM = inputs.straightLengthMm / 1000
  // Arc length for 90° = π/2 * R; use reference bend radius for schedule length.
  const bendLengthM = ((Math.PI / 2) * inputs.bendRadiusMm) / 1000
  const pathLengthM = sectionLengthM + bendLengthM

  const weight = evaluateWeight({
    cables: inputs.cables.map((c) => ({
      cableInstanceId: c.id,
      massKgPerM: c.massKgPerM,
      lengthM: pathLengthM,
    })),
    containmentAndAccessoriesKg: inputs.containmentMassKg,
    containmentMassKnown: true,
  })

  const structural = structuralSupportPanelResult({
    id: 'result-structural',
    inputRevisionOrHash: inputHash,
    sectionOrFittingId: 'sec-synth-001',
  })

  const results: ValidationResult[] = [
    toValidationResult({
      id: 'result-area',
      calculationVersion: area.calculationVersion,
      inputRevisionOrHash: inputHash,
      check: 'spare_area',
      status: area.status,
      issueCode: area.issueCode,
      sectionOrFittingId: 'sec-synth-001',
      evidence: area.evidence,
      measured: [
        {
          name: 'spare_percent',
          value: area.sparePercent ?? undefined,
          required: area.targetPercent,
          unit: '%',
          known: area.sparePercent != null,
        },
      ],
    }),
    toValidationResult({
      id: 'result-arrangement',
      calculationVersion: arrangement.calculationVersion,
      inputRevisionOrHash: inputHash,
      check: 'arrangement',
      status: arrangement.status,
      issueCode: arrangement.issueCode,
      sectionOrFittingId: 'sec-synth-001',
      evidence: arrangement.evidence,
      measured: [
        {
          name: 'clear_gap',
          value: arrangement.requiredClearGapMm ?? undefined,
          unit: 'mm',
          known: arrangement.requiredClearGapMm != null,
        },
      ],
    }),
    ...bends.map((b) =>
      toValidationResult({
        id: `result-bend-${b.cableInstanceId}`,
        calculationVersion: b.calculationVersion,
        inputRevisionOrHash: inputHash,
        check: 'bend_radius',
        status: b.status,
        issueCode: b.issueCode,
        sectionOrFittingId: 'fit-synth-001',
        cableId: b.cableInstanceId,
        evidence: `${b.message}. ${b.evidence}`,
        measured: [
          {
            name: 'R_achieved',
            value: b.achievedCentrelineRadiusMm ?? undefined,
            required: b.requiredCentrelineRadiusMm ?? undefined,
            unit: 'mm',
            known: b.achievedCentrelineRadiusMm != null,
          },
        ],
      }),
    ),
    toValidationResult({
      id: 'result-weight',
      calculationVersion: weight.calculationVersion,
      inputRevisionOrHash: inputHash,
      check: 'weight',
      status: weight.status,
      issueCode: weight.issueCode,
      sectionOrFittingId: 'sec-synth-001',
      evidence: weight.evidence,
      measured: [
        {
          name: 'combined_kg',
          value: weight.combinedInstalledKg ?? undefined,
          unit: 'kg',
          known: weight.combinedInstalledKg != null,
        },
      ],
    }),
    structural,
  ]

  return {
    provenance: PROVENANCE.fixture,
    section: {
      id: 'sec-synth-001',
      reference: 'L01-SM-TR-001',
      lengthM: sectionLengthM,
    },
    fitting: {
      id: 'fit-synth-001',
      reference: 'L01-SM-TR-FT-001',
      kind: 'horizontal_90',
    },
    inputs,
    inputHash,
    geometry,
    area,
    arrangement,
    bends,
    weight,
    structural,
    results,
    paths,
  }
}

/** Apply a rule/input change: previous results become STALE against the new hash (AC10). */
export function applyInputChangeKeepingPriorResults(
  prior: DemoProjectSnapshot,
  nextInputs: DemoProjectInputs,
): { stalePriorResults: ValidationResult[]; refreshed: DemoProjectSnapshot } {
  const refreshed = buildDemoSnapshot(nextInputs)
  const stalePriorResults = markStaleResults(prior.results, refreshed.inputHash)
  return { stalePriorResults, refreshed }
}
