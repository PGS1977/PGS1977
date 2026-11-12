/**
 * Multi-manufacturer registry (CDV-10).
 * Selection is per project; catalogues are never hard-coded to one supplier.
 * Structured product values are not invented here — incomplete makers stay incomplete.
 */

import { z } from 'zod'

export const ManufacturerKindSchema = z.enum(['cable', 'containment'])
export type ManufacturerKind = z.infer<typeof ManufacturerKindSchema>

export const StructuredCatalogueStatusSchema = z.enum([
  'fixture',
  'incomplete',
  'partial',
  'verified_available',
])
export type StructuredCatalogueStatus = z.infer<
  typeof StructuredCatalogueStatusSchema
>

export const ManufacturerConstraintSchema = z.enum([
  'LV_ONLY',
  'NEVER_OVERHEAD_LINE',
])
export type ManufacturerConstraint = z.infer<typeof ManufacturerConstraintSchema>

export const ManufacturerSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  /** Product role(s) this maker supplies. */
  kinds: z.array(ManufacturerKindSchema).min(1),
  structuredStatus: StructuredCatalogueStatusSchema,
  constraints: z.array(ManufacturerConstraintSchema).default([]),
  /** Owner-supplied raw paths under data/raw/ when present. */
  rawSourceRefs: z.array(z.string()).default([]),
  notes: z.string().optional(),
})
export type Manufacturer = z.infer<typeof ManufacturerSchema>

/**
 * Known makers available for selection. New makers are appended here as
 * owner-supplied sources arrive — UI iterates this list; no single-supplier lock-in.
 */
export const KNOWN_MANUFACTURERS: readonly Manufacturer[] = [
  {
    id: 'synthetic',
    displayName: 'Synthetic fixtures',
    kinds: ['cable', 'containment'],
    structuredStatus: 'fixture',
    constraints: [],
    rawSourceRefs: [],
    notes: 'SYNTHETIC FIXTURE — development only; never manufacturer-verified.',
  },
  {
    id: 'bicc',
    displayName: 'BICC',
    kinds: ['cable'],
    structuredStatus: 'incomplete',
    constraints: ['LV_ONLY', 'NEVER_OVERHEAD_LINE'],
    rawSourceRefs: ['data/raw/Power-Cable-EN-Catalogue_June25_digital.pdf'],
    notes:
      'Raw LV catalogue received. Extract LV only — never Overhead Line. No structured OD/kg/bend yet.',
  },
  {
    id: 'cleveland',
    displayName: 'Cleveland Cable',
    kinds: ['cable'],
    structuredStatus: 'incomplete',
    constraints: [],
    rawSourceRefs: [
      'data/raw/6181B-insulated-cable-xlpe-lszh-up-to-35mm.pdf',
      'data/raw/6181b-mains-cable-xlpe-lszh-50mm-1000mm.pdf',
      'data/raw/624-b-twin-and-earth-cable-lszh-1mm-16mm.pdf',
      'data/raw/624-b-twin-and-earth-cable-lszh-1mm-16mm (1).pdf',
      'data/raw/6491B-H07ZR-lszh-insulated-cable-up-to-630mm.pdf',
      'data/raw/6941ab-power-cable-xlpe-awa-lszh-50mm-1000mm.pdf',
      'data/raw/bs6724-1kv-mains-cable-xlpe-swa-lszh-up-to-16mm.pdf',
      'data/raw/bs6724-1kv-mains-cable-xlpe-swa-lszh-25mm-400mm.pdf',
      'data/raw/bs7846-bs6387-f2-fire-resistant-mains-cable-up-to-16mm.pdf',
      'data/raw/bs7846-bs6387-f2-fire-resistant-mains-cable-25mm-400mm.pdf',
      'data/raw/bs7846-bs8491-f120-enhanced-fire-resistant-mains-cable-4mm-16mm.pdf',
      'data/raw/bs7846-bs8491-f120-enhanced-fire-resistant-mains-cable-25mm-400mm.pdf',
    ],
    notes:
      'Raw LV datasheets received (CDV-9). Structured OD/kg/bend not yet extracted.',
  },
  {
    id: 'cablofil',
    displayName: 'Cablofil',
    kinds: ['containment'],
    structuredStatus: 'incomplete',
    constraints: [],
    rawSourceRefs: ['data/raw/Cablofil Fasclic+ 2023 WEB rev_11.5.23.pdf'],
    notes: 'Raw Cablofil catalogue received. Structured usable envelope not yet extracted.',
  },
  {
    id: 'swifts',
    displayName: 'Swifts',
    kinds: ['containment'],
    structuredStatus: 'incomplete',
    constraints: [],
    rawSourceRefs: [
      'data/raw/swifts-cable-ladder.pdf',
      'data/raw/swifts-cable-tray-technical-guide.pdf',
    ],
    notes: 'Raw Swifts catalogues received. Structured usable envelope not yet extracted.',
  },
] as const

export const DEFAULT_CABLE_MANUFACTURER_IDS = ['synthetic'] as const
export const DEFAULT_CONTAINMENT_MANUFACTURER_IDS = ['synthetic'] as const

export function getManufacturer(id: string): Manufacturer | undefined {
  return KNOWN_MANUFACTURERS.find((m) => m.id === id)
}

export function manufacturersForKind(kind: ManufacturerKind): Manufacturer[] {
  return KNOWN_MANUFACTURERS.filter((m) => m.kinds.includes(kind))
}

export function structuredCatalogueLabel(
  status: StructuredCatalogueStatus,
): string {
  switch (status) {
    case 'fixture':
      return 'FIXTURE'
    case 'incomplete':
      return 'INCOMPLETE'
    case 'partial':
      return 'PARTIAL'
    case 'verified_available':
      return 'VERIFIED'
  }
}

export function manufacturerConstraintLabel(
  constraint: ManufacturerConstraint,
): string {
  switch (constraint) {
    case 'LV_ONLY':
      return 'LV only'
    case 'NEVER_OVERHEAD_LINE':
      return 'Never Overhead Line'
  }
}

/** Product-source shaped rows that can be filtered by manufacturer selection. */
export type ManufacturerScopedSource = {
  manufacturerId: string
  manufacturer: string
  productKind: ManufacturerKind
}

export function filterSourcesByManufacturerIds<T extends ManufacturerScopedSource>(
  sources: readonly T[],
  selectedIds: readonly string[],
  kind?: ManufacturerKind,
): T[] {
  const selected = new Set(selectedIds)
  return sources.filter((s) => {
    if (!selected.has(s.manufacturerId)) return false
    if (kind != null && s.productKind !== kind) return false
    return true
  })
}

export function isManufacturerSelected(
  selectedIds: readonly string[],
  manufacturerId: string,
): boolean {
  return selectedIds.includes(manufacturerId)
}

export function toggleManufacturerId(
  selectedIds: readonly string[],
  manufacturerId: string,
): string[] {
  if (selectedIds.includes(manufacturerId)) {
    return selectedIds.filter((id) => id !== manufacturerId)
  }
  return [...selectedIds, manufacturerId]
}

/**
 * BICC hard rule: LV only; never Overhead Line.
 * Callers that import BICC product rows must reject OH families.
 */
export function assertBiccLvOnly(args: {
  manufacturerId: string
  familyOrType?: string
}): { ok: true } | { ok: false; reason: string } {
  if (args.manufacturerId !== 'bicc') return { ok: true }
  const hay = (args.familyOrType ?? '').toLowerCase()
  const overheadHints = [
    'overhead',
    'overhead line',
    'aac',
    'aaac',
    'acsr',
    'abc conductor',
  ]
  if (overheadHints.some((h) => hay.includes(h))) {
    return {
      ok: false,
      reason:
        'BICC Overhead Line products are excluded — LV only (AS08 / DO-NOT-USE-OVERHEAD-LINE).',
    }
  }
  return { ok: true }
}
