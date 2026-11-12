/**
 * Human-editable section/fitting references (brief §6).
 * These are attributes, not database keys. IDs remain immutable UUIDs/strings.
 */

import { z } from 'zod'

export const LevelCodeSchema = z.enum(['L00', 'L01', 'B1', 'RF', 'VR'])
export type LevelCode = z.infer<typeof LevelCodeSchema>

export const ServiceCodeSchema = z.enum([
  'MA',
  'SM',
  'FC',
  'TC',
  'FA',
  'SE',
  'BM',
  'EL',
  'MX',
])
export type ServiceCode = z.infer<typeof ServiceCodeSchema>

export const ContainmentTypeCodeSchema = z.enum([
  'TR',
  'LD',
  'TK',
  'BK',
  'CN',
])
export type ContainmentTypeCode = z.infer<typeof ContainmentTypeCodeSchema>

/** Section: LEVEL-SERVICE-TYPE-NUMBER e.g. L01-SM-TR-001 */
export const SectionReferenceSchema = z
  .string()
  .regex(
    /^(L00|L01|B1|RF|VR)-(MA|SM|FC|TC|FA|SE|BM|EL|MX)-(TR|LD|TK|BK|CN)-\d{3,}$/,
    'Section reference must be LEVEL-SERVICE-TYPE-NUMBER',
  )

/** Fitting: LEVEL-SERVICE-TYPE-FT-NUMBER e.g. L01-SM-TR-FT-001 */
export const FittingReferenceSchema = z
  .string()
  .regex(
    /^(L00|L01|B1|RF|VR)-(MA|SM|FC|TC|FA|SE|BM|EL|MX)-(TR|LD|TK|BK|CN)-FT-\d{3,}$/,
    'Fitting reference must be LEVEL-SERVICE-TYPE-FT-NUMBER',
  )

export function formatSectionReference(
  level: LevelCode,
  service: ServiceCode,
  type: ContainmentTypeCode,
  number: number,
): string {
  return `${level}-${service}-${type}-${String(number).padStart(3, '0')}`
}

export function formatFittingReference(
  level: LevelCode,
  service: ServiceCode,
  type: ContainmentTypeCode,
  number: number,
): string {
  return `${level}-${service}-${type}-FT-${String(number).padStart(3, '0')}`
}
