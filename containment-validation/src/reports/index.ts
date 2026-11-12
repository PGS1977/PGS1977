/**
 * Export adapters (brief §8). Branded PDF/Excel/Word are Milestone 3.
 * Milestone 1: placeholder only.
 */

export type ReportFormat = 'json_snapshot'

export function supportedReportFormats(): ReportFormat[] {
  return ['json_snapshot']
}
