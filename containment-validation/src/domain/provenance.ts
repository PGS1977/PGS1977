/**
 * Product-data provenance (brief §5, D04).
 * Fixtures must never be presented as manufacturer-verified.
 */

import { z } from 'zod'

export const ProvenanceStatusSchema = z.enum([
  'fixture',
  'assumed',
  'verified',
])

export type ProvenanceStatus = z.infer<typeof ProvenanceStatusSchema>

export const PROVENANCE = {
  fixture: 'fixture',
  assumed: 'assumed',
  verified: 'verified',
} as const satisfies Record<ProvenanceStatus, ProvenanceStatus>

/** UI/report label: fixtures are conspicuously synthetic. */
export function provenanceLabel(status: ProvenanceStatus): string {
  switch (status) {
    case 'fixture':
      return 'SYNTHETIC FIXTURE — not manufacturer-verified'
    case 'assumed':
      return 'Assumed data — engineer/project-entered'
    case 'verified':
      return 'Verified manufacturer record'
  }
}

export function isManufacturerClaimAllowed(status: ProvenanceStatus): boolean {
  return status === 'verified'
}
