/**
 * Project and revision persistence (brief §8).
 * PoC will use local browser storage + JSON export; interface reserved for later backend.
 */

export type StorageBackend = 'local_json' | 'remote_authenticated'

export interface ProjectStore {
  readonly backend: StorageBackend
  save(projectJson: string): Promise<void>
  load(): Promise<string | null>
}

export class InMemoryProjectStore implements ProjectStore {
  readonly backend = 'local_json' as const
  private data: string | null = null

  async save(projectJson: string): Promise<void> {
    this.data = projectJson
  }

  async load(): Promise<string | null> {
    return this.data
  }
}
