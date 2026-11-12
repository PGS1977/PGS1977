/**
 * Versioned project document for JSON export/import and local persistence (AC11).
 */

import { z } from 'zod'
import {
  ProvenanceStatusSchema,
  SCHEMA_VERSION,
  parseOrThrow,
} from '../domain'
import {
  buildDemoSnapshot,
  type DemoProjectInputs,
  type DemoProjectSnapshot,
} from '../project/syntheticProject'

export const PROJECT_DOCUMENT_KIND = 'containment_validation_project' as const

export const DemoCableSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  outsideDiameterMm: z.number().finite().positive(),
  massKgPerM: z.number().finite().nonnegative(),
  requiredBendRadiusMm: z.number().finite().positive(),
  bendConvention: z.literal('centreline'),
})

export const DemoProjectInputsSchema = z.object({
  spareTargetPercent: z.number().finite().min(0).lt(100),
  arrangementMode: z.enum(['touching', 'spaced']),
  spacedMultiplier: z.number().finite().positive(),
  usableWidthMm: z.number().finite().positive(),
  usableHeightMm: z.number().finite().positive(),
  straightLengthMm: z.number().finite().positive(),
  bendRadiusMm: z.number().finite().positive(),
  containmentMassKg: z.number().finite().nonnegative(),
  cables: z.array(DemoCableSchema).min(1),
})

export const ProductSourceRefSchema = z.object({
  id: z.string().min(1),
  manufacturer: z.string().min(1),
  sourceFileOrReference: z.string().min(1),
  revision: z.string().min(1),
  provenance: ProvenanceStatusSchema,
  notes: z.string().optional(),
})

export const DesignBasisSchema = z.object({
  displayUnits: z.enum(['metric', 'imperial']),
  spareTargetPercent: z.number().finite().min(0).lt(100),
  arrangementMode: z.enum(['touching', 'spaced', 'stacked']),
  spacedMultiplier: z.number().finite().positive().optional(),
  stackedLayerCount: z.number().int().positive().optional(),
  stackedVerticalGapMm: z.number().finite().nonnegative().optional(),
  productSources: z.array(ProductSourceRefSchema),
  assumptions: z.array(
    z.object({
      id: z.string().min(1),
      summary: z.string().min(1),
      status: z.enum(['provisional', 'confirmed']),
    }),
  ),
  catalogueState: z.enum(['incomplete', 'partial', 'verified_available']),
})

export const PlacementEvidenceSchema = z.object({
  cableInstanceId: z.string().min(1),
  outsideDiameterMm: z.number().finite().positive(),
  centreXMm: z.number().finite(),
  centreYMm: z.number().finite(),
})

export const CalculationEvidenceSchema = z.object({
  inputHash: z.string().min(1),
  section: z.object({
    id: z.string().min(1),
    reference: z.string().min(1),
    lengthM: z.number().finite().nonnegative(),
  }),
  fitting: z.object({
    id: z.string().min(1),
    reference: z.string().min(1),
    kind: z.literal('horizontal_90'),
  }),
  cableIds: z.array(z.string().min(1)),
  placements: z.array(PlacementEvidenceSchema),
  area: z.object({
    status: z.string().min(1),
    issueCode: z.string().min(1),
    sparePercent: z.number().finite().nullable(),
    netAreaMm2: z.number().finite().nullable(),
    cableAreaSumMm2: z.number().finite(),
  }),
  bends: z.array(
    z.object({
      cableInstanceId: z.string().min(1),
      status: z.string().min(1),
      issueCode: z.string().min(1),
      achievedCentrelineRadiusMm: z.number().finite().nullable(),
      requiredCentrelineRadiusMm: z.number().finite().nullable(),
    }),
  ),
  weight: z.object({
    status: z.string().min(1),
    issueCode: z.string().min(1),
    knownCableSubtotalKg: z.number().finite(),
    totalCableKg: z.number().finite().nullable(),
    combinedInstalledKg: z.number().finite().nullable(),
    contributions: z.array(
      z.object({
        cableInstanceId: z.string().min(1),
        lengthM: z.number().finite().nonnegative(),
        contributionKg: z.number().finite().nullable(),
      }),
    ),
  }),
  resultIds: z.array(z.string().min(1)),
})

export const ProjectDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  documentKind: z.literal(PROJECT_DOCUMENT_KIND),
  project: z.object({
    id: z.string().min(1),
    projectNumber: z.string().min(1),
    name: z.string().min(1),
    clientSite: z.string().optional(),
    stage: z.string().optional(),
    designer: z.string().optional(),
    displayUnits: z.enum(['metric', 'imperial']),
    revision: z.string().min(1),
  }),
  designBasis: DesignBasisSchema,
  calculationInputs: DemoProjectInputsSchema,
  evidence: CalculationEvidenceSchema,
  updatedAt: z.string().min(1),
})

export type ProjectDocument = z.infer<typeof ProjectDocumentSchema>
export type DesignBasis = z.infer<typeof DesignBasisSchema>

export const FIXTURE_PRODUCT_SOURCES: DesignBasis['productSources'] = [
  {
    id: 'fixture-source-containment',
    manufacturer: 'SYNTHETIC',
    sourceFileOrReference: 'data/fixtures/containment-products.json',
    revision: 'fixture-2026-11-12',
    provenance: 'fixture',
    notes: 'SYNTHETIC FIXTURE — not manufacturer-verified.',
  },
  {
    id: 'fixture-source-cable',
    manufacturer: 'SYNTHETIC',
    sourceFileOrReference: 'data/fixtures/cable-products.json',
    revision: 'fixture-2026-11-12',
    provenance: 'fixture',
    notes: 'SYNTHETIC FIXTURE — not Prysmian production values.',
  },
]

export const DEFAULT_ASSUMPTIONS: DesignBasis['assumptions'] = [
  {
    id: 'AS01',
    summary:
      'Unequal-diameter spaced clear-gap reference uses max(D1, D2); provisional pending owner review.',
    status: 'provisional',
  },
  {
    id: 'AS02',
    summary:
      'Stacked layer count and vertical gap are explicit project inputs; no silent defaults.',
    status: 'provisional',
  },
]

export function evidenceFromSnapshot(
  snapshot: DemoProjectSnapshot,
): z.infer<typeof CalculationEvidenceSchema> {
  return {
    inputHash: snapshot.inputHash,
    section: snapshot.section,
    fitting: snapshot.fitting,
    cableIds: snapshot.inputs.cables.map((c) => c.id),
    placements: snapshot.arrangement.placements.map((p) => ({
      cableInstanceId: p.cableInstanceId,
      outsideDiameterMm: p.outsideDiameterMm,
      centreXMm: p.centreXMm,
      centreYMm: p.centreYMm,
    })),
    area: {
      status: snapshot.area.status,
      issueCode: snapshot.area.issueCode,
      sparePercent: snapshot.area.sparePercent,
      netAreaMm2: snapshot.area.netAreaMm2,
      cableAreaSumMm2: snapshot.area.cableAreaSumMm2,
    },
    bends: snapshot.bends.map((b) => ({
      cableInstanceId: b.cableInstanceId,
      status: b.status,
      issueCode: b.issueCode,
      achievedCentrelineRadiusMm: b.achievedCentrelineRadiusMm,
      requiredCentrelineRadiusMm: b.requiredCentrelineRadiusMm,
    })),
    weight: {
      status: snapshot.weight.status,
      issueCode: snapshot.weight.issueCode,
      knownCableSubtotalKg: snapshot.weight.knownCableSubtotalKg,
      totalCableKg: snapshot.weight.totalCableKg,
      combinedInstalledKg: snapshot.weight.combinedInstalledKg,
      contributions: snapshot.weight.contributions.map((c) => ({
        cableInstanceId: c.cableInstanceId,
        lengthM: c.lengthM,
        contributionKg: c.contributionKg,
      })),
    },
    resultIds: snapshot.results.map((r) => r.id),
  }
}

export function createProjectDocument(args: {
  project: ProjectDocument['project']
  designBasis: DesignBasis
  calculationInputs: DemoProjectInputs
  updatedAt?: string
}): ProjectDocument {
  const snapshot = buildDemoSnapshot(args.calculationInputs)
  return parseOrThrow(
    ProjectDocumentSchema,
    {
      schemaVersion: SCHEMA_VERSION,
      documentKind: PROJECT_DOCUMENT_KIND,
      project: args.project,
      designBasis: args.designBasis,
      calculationInputs: args.calculationInputs,
      evidence: evidenceFromSnapshot(snapshot),
      updatedAt: args.updatedAt ?? new Date().toISOString(),
    },
    'ProjectDocument',
  )
}

export function exportProjectJson(doc: ProjectDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`
}

export function importProjectJson(json: string): ProjectDocument {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Invalid project JSON: parse failed')
  }
  return parseOrThrow(ProjectDocumentSchema, raw, 'ProjectDocument')
}

/**
 * Reopen: parse document, recompute from stored inputs, compare evidence.
 * Returns identical document fields required by AC11 when engines are deterministic.
 */
export function reopenProjectDocument(doc: ProjectDocument): {
  document: ProjectDocument
  recomputed: ProjectDocument
  identical: boolean
  mismatches: string[]
} {
  const parsed = ProjectDocumentSchema.parse(doc)
  const recomputed = createProjectDocument({
    project: parsed.project,
    designBasis: {
      ...parsed.designBasis,
      // Keep design-basis spare/arrangement aligned with calculation inputs on reopen.
      spareTargetPercent: parsed.calculationInputs.spareTargetPercent,
      arrangementMode: parsed.calculationInputs.arrangementMode,
      spacedMultiplier: parsed.calculationInputs.spacedMultiplier,
    },
    calculationInputs: parsed.calculationInputs,
    updatedAt: parsed.updatedAt,
  })

  const mismatches: string[] = []
  if (parsed.project.id !== recomputed.project.id) mismatches.push('project.id')
  if (parsed.evidence.section.id !== recomputed.evidence.section.id) {
    mismatches.push('section.id')
  }
  if (parsed.evidence.fitting.id !== recomputed.evidence.fitting.id) {
    mismatches.push('fitting.id')
  }
  if (
    JSON.stringify(parsed.evidence.cableIds) !==
    JSON.stringify(recomputed.evidence.cableIds)
  ) {
    mismatches.push('cableIds')
  }
  if (
    JSON.stringify(parsed.calculationInputs) !==
    JSON.stringify(recomputed.calculationInputs)
  ) {
    mismatches.push('calculationInputs')
  }
  if (
    JSON.stringify(parsed.evidence.placements) !==
    JSON.stringify(recomputed.evidence.placements)
  ) {
    mismatches.push('placements')
  }
  if (
    JSON.stringify(parsed.evidence.area) !==
    JSON.stringify(recomputed.evidence.area)
  ) {
    mismatches.push('area')
  }
  if (
    JSON.stringify(parsed.evidence.weight) !==
    JSON.stringify(recomputed.evidence.weight)
  ) {
    mismatches.push('weight')
  }
  if (
    JSON.stringify(parsed.evidence.bends) !==
    JSON.stringify(recomputed.evidence.bends)
  ) {
    mismatches.push('bends')
  }
  if (
    JSON.stringify(parsed.evidence.resultIds) !==
    JSON.stringify(recomputed.evidence.resultIds)
  ) {
    mismatches.push('resultIds')
  }

  return {
    document: parsed,
    recomputed,
    identical: mismatches.length === 0,
    mismatches,
  }
}

export function defaultDesignBasisFromInputs(
  inputs: DemoProjectInputs,
): DesignBasis {
  return {
    displayUnits: 'metric',
    spareTargetPercent: inputs.spareTargetPercent,
    arrangementMode: inputs.arrangementMode,
    spacedMultiplier: inputs.spacedMultiplier,
    productSources: FIXTURE_PRODUCT_SOURCES,
    assumptions: DEFAULT_ASSUMPTIONS,
    catalogueState: 'incomplete',
  }
}
