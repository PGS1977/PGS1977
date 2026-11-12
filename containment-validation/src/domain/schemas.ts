/**
 * Runtime-validated, versioned domain records (brief §5).
 * Immutable IDs; human references are editable attributes.
 */

import { z } from 'zod'
import {
  ContainmentTypeCodeSchema,
  FittingReferenceSchema,
  LevelCodeSchema,
  SectionReferenceSchema,
  ServiceCodeSchema,
} from './naming'
import { ProvenanceStatusSchema } from './provenance'
import { IssueCodeSchema, ResultStatusSchema } from './statuses'

export const SCHEMA_VERSION = '1.0.0' as const

export const IdSchema = z.string().min(1)

/** Axis-aligned rectangle in mm within a cross-section plane (local coords). */
export const RectMmSchema = z.object({
  xMm: z.number().finite(),
  yMm: z.number().finite(),
  widthMm: z.number().finite().positive(),
  heightMm: z.number().finite().positive(),
})
export type RectMm = z.infer<typeof RectMmSchema>

export const ProductSourceSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  manufacturer: z.string().min(1),
  sourceFileOrReference: z.string().min(1),
  revision: z.string().min(1),
  date: z.string().optional(),
  provenance: ProvenanceStatusSchema,
  notes: z.string().optional(),
})
export type ProductSource = z.infer<typeof ProductSourceSchema>

export const UsableEnvelopeSchema = z.object({
  /** Usable internal cross-sectional area in mm² when known as a scalar. */
  areaMm2: z.number().finite().positive().optional(),
  /** Optional rectangular usable envelope (preferred when geometry is known). */
  rectMm: RectMmSchema.optional(),
})
export type UsableEnvelope = z.infer<typeof UsableEnvelopeSchema>

export const ContainmentProductSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  productSourceId: IdSchema,
  code: z.string().min(1),
  family: z.string().min(1),
  type: ContainmentTypeCodeSchema,
  /** Nominal width is metadata only — never used as usable envelope. */
  nominalWidthMm: z.number().finite().positive().optional(),
  nominalDepthMm: z.number().finite().positive().optional(),
  usableEnvelope: UsableEnvelopeSchema.optional(),
  massKg: z.number().finite().nonnegative().optional(),
  massKnown: z.boolean(),
})
export type ContainmentProduct = z.infer<typeof ContainmentProductSchema>

export const BendConstraintSchema = z.object({
  requiredRadiusMm: z.number().finite().positive(),
  /** Manufacturer convention: centreline or inner surface of cable. */
  convention: z.enum(['centreline', 'inner_surface']),
  condition: z.enum(['fixed_installation', 'installation_pulling', 'unspecified']),
  reference: z.string().optional(),
})
export type BendConstraint = z.infer<typeof BendConstraintSchema>

export const CableProductSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  productSourceId: IdSchema,
  code: z.string().min(1),
  type: z.string().min(1),
  outsideDiameterMm: z.number().finite().positive().optional(),
  /** Linear mass in kg/m when known. Missing ≠ 0. */
  massKgPerM: z.number().finite().nonnegative().optional(),
  massKnown: z.boolean(),
  bendConstraint: BendConstraintSchema.optional(),
})
export type CableProduct = z.infer<typeof CableProductSchema>

export const ProjectRuleSettingsSchema = z.object({
  spareTargetPercent: z.number().finite().min(0).lt(100).default(25),
  arrangement: z
    .enum(['touching', 'spaced', 'stacked'])
    .default('touching'),
  spacedMultiplier: z.number().finite().positive().optional(),
  stackedLayerCount: z.number().int().positive().optional(),
  stackedVerticalGapMm: z.number().finite().nonnegative().optional(),
})
export type ProjectRuleSettings = z.infer<typeof ProjectRuleSettingsSchema>

export const ProjectSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  projectNumber: z.string().min(1),
  name: z.string().min(1),
  clientSite: z.string().optional(),
  stage: z.string().optional(),
  designer: z.string().optional(),
  displayUnits: z.enum(['metric', 'imperial']).default('metric'),
  revision: z.string().min(1),
  ruleSettings: ProjectRuleSettingsSchema.default({
    spareTargetPercent: 25,
    arrangement: 'touching',
  }),
})
export type Project = z.infer<typeof ProjectSchema>

export const SectionSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  reference: SectionReferenceSchema,
  productId: IdSchema,
  level: LevelCodeSchema,
  service: ServiceCodeSchema,
  lengthM: z.number().finite().nonnegative(),
  arrangementSettings: ProjectRuleSettingsSchema.partial().optional(),
})
export type Section = z.infer<typeof SectionSchema>

export const FittingSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  reference: FittingReferenceSchema,
  productId: IdSchema,
  level: LevelCodeSchema,
  service: ServiceCodeSchema,
  kind: z.enum(['horizontal_90', 'other']).default('horizontal_90'),
})
export type Fitting = z.infer<typeof FittingSchema>

export const FixingObstructionSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  productSourceId: IdSchema.optional(),
  ownerSectionOrFittingId: IdSchema,
  /** Intrusion rectangle in the usable envelope plane (mm). Missing → incomplete. */
  intrusionRectMm: RectMmSchema.optional(),
  /** Optional precomputed intrusion area when only scalar area is known (assumed). */
  intrusionAreaMm2: z.number().finite().nonnegative().optional(),
  massKg: z.number().finite().nonnegative().optional(),
  massKnown: z.boolean().default(false),
  provenance: ProvenanceStatusSchema,
  sourceNote: z.string().optional(),
})
export type FixingObstruction = z.infer<typeof FixingObstructionSchema>

export const CableInstanceSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  reference: z.string().min(1),
  productId: IdSchema,
  sourceRow: z.string().optional(),
  /** Ordered owner IDs (sections/fittings) forming the continuous route. */
  routeOwnerIds: z.array(IdSchema).min(1),
  /** Per-owner path length in metres when lengths differ. */
  lengthByOwnerM: z.record(z.string(), z.number().finite().nonnegative()).optional(),
})
export type CableInstance = z.infer<typeof CableInstanceSchema>

export const MeasuredValueSchema = z.object({
  name: z.string().min(1),
  value: z.number().finite().optional(),
  required: z.number().finite().optional(),
  unit: z.string().min(1),
  known: z.boolean(),
})
export type MeasuredValue = z.infer<typeof MeasuredValueSchema>

export const ValidationResultSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  calculationVersion: z.string().min(1),
  inputRevisionOrHash: z.string().min(1),
  productDataRevisions: z.array(z.string()),
  check: z.string().min(1),
  status: ResultStatusSchema,
  issueCode: IssueCodeSchema,
  sectionOrFittingId: IdSchema.optional(),
  cableId: IdSchema.optional(),
  evidence: z.string(),
  measured: z.array(MeasuredValueSchema).default([]),
})
export type ValidationResult = z.infer<typeof ValidationResultSchema>

/** Drawing / level stubs reserved for M2 (AC12 hooks). */
export const DrawingStubSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  pdfSource: z.string().optional(),
  revision: z.string().optional(),
  scaleConfirmed: z.boolean().default(false),
})
export type DrawingStub = z.infer<typeof DrawingStubSchema>

export const LevelStubSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  id: IdSchema,
  code: LevelCodeSchema,
  elevationM: z.number().finite().optional(),
})
export type LevelStub = z.infer<typeof LevelStubSchema>

export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label = 'record',
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid ${label}: ${detail}`)
  }
  return result.data
}
