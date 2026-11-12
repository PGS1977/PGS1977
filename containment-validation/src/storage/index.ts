/**
 * Project and revision persistence (brief §8).
 * Local browser storage + JSON export/import for Milestone 1 PoC.
 */

export * from './projectDocument'
export * from './projectLibrary'

export type StorageBackend = 'local_json' | 'remote_authenticated' | 'memory'

export interface ProjectStore {
  readonly backend: StorageBackend
  save(projectJson: string): Promise<void>
  load(): Promise<string | null>
}

/** Single-slot store retained for simple adapters; prefer ProjectLibrary. */
export class InMemoryProjectStore implements ProjectStore {
  readonly backend = 'memory' as const
  private data: string | null = null

  async save(projectJson: string): Promise<void> {
    this.data = projectJson
  }

  async load(): Promise<string | null> {
    return this.data
  }
}
