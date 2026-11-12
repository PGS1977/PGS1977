/**
 * Cable and combined installed weight (brief §4.5).
 * Missing mass is unknown, not zero (AC09).
 */

import { RESULT_STATUS, type IssueCode, type ResultStatus } from '../domain/statuses'

export const WEIGHT_CALCULATION_VERSION = 'weight-1.0.0' as const

export type CableWeightContribution = {
  cableInstanceId: string
  massKgPerM: number | null
  lengthM: number
  /** kg contribution when mass known; null when mass missing. */
  contributionKg: number | null
  massKnown: boolean
}

export type WeightInput = {
  cables: ReadonlyArray<{
    cableInstanceId: string
    /** kg/m when known. null/undefined = missing (≠ 0). */
    massKgPerM: number | null | undefined
    lengthM: number
  }>
  /** Containment + included cover/divider/fixing/accessory kg when known. */
  containmentAndAccessoriesKg: number | null | undefined
  containmentMassKnown: boolean
}

export type WeightResult = {
  status: ResultStatus
  issueCode: IssueCode
  contributions: CableWeightContribution[]
  /** Sum of known cable contributions only. */
  knownCableSubtotalKg: number
  /** Total cable kg when all cable masses known; otherwise null. */
  totalCableKg: number | null
  containmentAndAccessoriesKg: number | null
  /** Combined installed kg when all masses known; otherwise null. */
  combinedInstalledKg: number | null
  evidence: string
  calculationVersion: typeof WEIGHT_CALCULATION_VERSION
}

/**
 * Cable_section_kg = manufacturer_cable_kg_per_m × actual_cable_length_in_section_m.
 * Combined_installed_kg = total_cable_kg + containment_kg + accessories.
 * A missing mass never becomes zero.
 */
export function evaluateWeight(input: WeightInput): WeightResult {
  const contributions: CableWeightContribution[] = input.cables.map((c) => {
    const massKnown =
      c.massKgPerM != null && Number.isFinite(c.massKgPerM) && c.massKgPerM >= 0
    const contributionKg = massKnown
      ? (c.massKgPerM as number) * c.lengthM
      : null
    return {
      cableInstanceId: c.cableInstanceId,
      massKgPerM: massKnown ? (c.massKgPerM as number) : null,
      lengthM: c.lengthM,
      contributionKg,
      massKnown,
    }
  })

  let knownCableSubtotalKg = 0
  let anyCableMissing = false
  for (const c of contributions) {
    if (c.massKnown && c.contributionKg != null) {
      knownCableSubtotalKg += c.contributionKg
    } else {
      anyCableMissing = true
    }
  }

  const totalCableKg = anyCableMissing ? null : knownCableSubtotalKg

  const containmentKnown =
    input.containmentMassKnown &&
    input.containmentAndAccessoriesKg != null &&
    Number.isFinite(input.containmentAndAccessoriesKg)
  const containmentAndAccessoriesKg = containmentKnown
    ? (input.containmentAndAccessoriesKg as number)
    : null

  const allKnown = !anyCableMissing && containmentKnown
  const combinedInstalledKg =
    allKnown && totalCableKg != null && containmentAndAccessoriesKg != null
      ? totalCableKg + containmentAndAccessoriesKg
      : null

  if (anyCableMissing || !containmentKnown) {
    return {
      status: RESULT_STATUS.INCOMPLETE,
      issueCode: 'WEIGHT_MASS_MISSING',
      contributions,
      knownCableSubtotalKg,
      totalCableKg,
      containmentAndAccessoriesKg,
      combinedInstalledKg,
      evidence: anyCableMissing
        ? `One or more cable masses are missing. Known cable subtotal ${knownCableSubtotalKg} kg; missing mass is not treated as zero.`
        : `Containment/accessory mass is missing. Known cable subtotal ${knownCableSubtotalKg} kg; combined total incomplete.`,
      calculationVersion: WEIGHT_CALCULATION_VERSION,
    }
  }

  return {
    status: RESULT_STATUS.PASS,
    issueCode: 'WEIGHT_COMPLETE',
    contributions,
    knownCableSubtotalKg,
    totalCableKg,
    containmentAndAccessoriesKg,
    combinedInstalledKg,
    evidence: `Cable ${totalCableKg} kg + containment/accessories ${containmentAndAccessoriesKg} kg = combined ${combinedInstalledKg} kg.`,
    calculationVersion: WEIGHT_CALCULATION_VERSION,
  }
}
