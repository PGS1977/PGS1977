/**
 * Product / cable-schedule / PDF import adapters (brief §8).
 * Milestone 1 Increment A/B: placeholder only — no catalogue wired to calculations yet.
 */

export type ImportErrorReport = {
  source: string
  errors: Array<{ path: string; message: string }>
}

export function createEmptyImportErrorReport(source: string): ImportErrorReport {
  return { source, errors: [] }
}
