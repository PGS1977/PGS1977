/**
 * Typed units and conversions at import/display boundaries (brief §4.1).
 * Internal calculation units: mm, mm², m, kg.
 */

export type LengthMm = number & { readonly __brand: 'mm' }
export type AreaMm2 = number & { readonly __brand: 'mm2' }
export type LengthM = number & { readonly __brand: 'm' }
export type MassKg = number & { readonly __brand: 'kg' }
export type MassKgPerM = number & { readonly __brand: 'kg_per_m' }
export type MassKgPerKm = number & { readonly __brand: 'kg_per_km' }

export const UNIT = {
  mm: 'mm',
  mm2: 'mm2',
  m: 'm',
  kg: 'kg',
  kg_per_m: 'kg/m',
  kg_per_km: 'kg/km',
} as const

export type UnitCode = (typeof UNIT)[keyof typeof UNIT]

export class AmbiguousUnitError extends Error {
  readonly code = 'AMBIGUOUS_UNIT' as const
  constructor(message: string) {
    super(message)
    this.name = 'AmbiguousUnitError'
  }
}

export function asMm(value: number): LengthMm {
  assertFiniteNonNegative(value, 'mm')
  return value as LengthMm
}

export function asMm2(value: number): AreaMm2 {
  assertFiniteNonNegative(value, 'mm2')
  return value as AreaMm2
}

export function asM(value: number): LengthM {
  assertFiniteNonNegative(value, 'm')
  return value as LengthM
}

export function asKg(value: number): MassKg {
  assertFiniteNonNegative(value, 'kg')
  return value as MassKg
}

export function asKgPerM(value: number): MassKgPerM {
  assertFiniteNonNegative(value, 'kg/m')
  return value as MassKgPerM
}

/** Cable mass may arrive in kg/km: divide by 1000 to obtain kg/m. */
export function kgPerKmToKgPerM(kgPerKm: number): MassKgPerM {
  assertFiniteNonNegative(kgPerKm, 'kg/km')
  return asKgPerM(kgPerKm / 1000)
}

/**
 * Convert a mass-per-length value at an import boundary.
 * Accepts only explicit 'kg/m' or 'kg/km'. Rejects ambiguous labels.
 */
export function massPerLengthToKgPerM(
  value: number,
  unitLabel: string,
): MassKgPerM {
  const normalised = unitLabel.trim().toLowerCase().replace(/\s+/g, '')
  if (normalised === 'kg/m' || normalised === 'kgperm' || normalised === 'kg·m⁻¹') {
    return asKgPerM(value)
  }
  if (
    normalised === 'kg/km' ||
    normalised === 'kgperkm' ||
    normalised === 'kg·km⁻¹'
  ) {
    return kgPerKmToKgPerM(value)
  }
  throw new AmbiguousUnitError(
    `Rejecting ambiguous or unsupported mass-per-length unit "${unitLabel}". Use kg/m or kg/km.`,
  )
}

export function mmToM(mm: LengthMm): LengthM {
  return asM(mm / 1000)
}

export function mToMm(m: LengthM): LengthMm {
  return asMm(m * 1000)
}

function assertFiniteNonNegative(value: number, unit: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new AmbiguousUnitError(
      `Expected finite non-negative ${unit} value, got ${String(value)}`,
    )
  }
}
