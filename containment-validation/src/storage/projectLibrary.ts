/**
 * Multi-project local library with JSON export/import (Increment E).
 */

import type { ProjectDocument } from './projectDocument'
import {
  exportProjectJson,
  importProjectJson,
} from './projectDocument'

export type ProjectSummary = {
  id: string
  projectNumber: string
  name: string
  revision: string
  stage?: string
  clientSite?: string
  updatedAt: string
  catalogueState: ProjectDocument['designBasis']['catalogueState']
}

export interface ProjectLibrary {
  readonly backend: 'local_json' | 'memory'
  list(): Promise<ProjectSummary[]>
  get(id: string): Promise<ProjectDocument | null>
  save(doc: ProjectDocument): Promise<void>
  remove(id: string): Promise<void>
  exportJson(id: string): Promise<string>
  importJson(json: string): Promise<ProjectDocument>
}

type LibraryBlob = {
  version: 1
  projects: Record<string, ProjectDocument>
}

function toSummary(doc: ProjectDocument): ProjectSummary {
  return {
    id: doc.project.id,
    projectNumber: doc.project.projectNumber,
    name: doc.project.name,
    revision: doc.project.revision,
    stage: doc.project.stage,
    clientSite: doc.project.clientSite,
    updatedAt: doc.updatedAt,
    catalogueState: doc.designBasis.catalogueState,
  }
}

export class MemoryProjectLibrary implements ProjectLibrary {
  readonly backend = 'memory' as const
  private projects = new Map<string, ProjectDocument>()

  async list(): Promise<ProjectSummary[]> {
    return [...this.projects.values()]
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<ProjectDocument | null> {
    return this.projects.get(id) ?? null
  }

  async save(doc: ProjectDocument): Promise<void> {
    this.projects.set(doc.project.id, {
      ...doc,
      updatedAt: new Date().toISOString(),
    })
  }

  async remove(id: string): Promise<void> {
    this.projects.delete(id)
  }

  async exportJson(id: string): Promise<string> {
    const doc = this.projects.get(id)
    if (!doc) throw new Error(`Project not found: ${id}`)
    return exportProjectJson(doc)
  }

  async importJson(json: string): Promise<ProjectDocument> {
    const doc = importProjectJson(json)
    await this.save(doc)
    return doc
  }
}

const LOCAL_KEY = 'containment-validation.projects.v1'

function readBlob(storage: Storage): LibraryBlob {
  const raw = storage.getItem(LOCAL_KEY)
  if (!raw) return { version: 1, projects: {} }
  try {
    const parsed = JSON.parse(raw) as LibraryBlob
    if (parsed?.version !== 1 || typeof parsed.projects !== 'object') {
      return { version: 1, projects: {} }
    }
    return parsed
  } catch {
    return { version: 1, projects: {} }
  }
}

function writeBlob(storage: Storage, blob: LibraryBlob): void {
  storage.setItem(LOCAL_KEY, JSON.stringify(blob))
}

/** Browser localStorage-backed project library. */
export class LocalStorageProjectLibrary implements ProjectLibrary {
  readonly backend = 'local_json' as const
  private readonly storage: Storage

  constructor(storage: Storage = localStorage) {
    this.storage = storage
  }

  async list(): Promise<ProjectSummary[]> {
    const blob = readBlob(this.storage)
    return Object.values(blob.projects)
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<ProjectDocument | null> {
    const blob = readBlob(this.storage)
    return blob.projects[id] ?? null
  }

  async save(doc: ProjectDocument): Promise<void> {
    const blob = readBlob(this.storage)
    blob.projects[doc.project.id] = {
      ...doc,
      updatedAt: new Date().toISOString(),
    }
    writeBlob(this.storage, blob)
  }

  async remove(id: string): Promise<void> {
    const blob = readBlob(this.storage)
    delete blob.projects[id]
    writeBlob(this.storage, blob)
  }

  async exportJson(id: string): Promise<string> {
    const doc = await this.get(id)
    if (!doc) throw new Error(`Project not found: ${id}`)
    return exportProjectJson(doc)
  }

  async importJson(json: string): Promise<ProjectDocument> {
    const doc = importProjectJson(json)
    await this.save(doc)
    return doc
  }
}

/** Prefer localStorage in browser; memory fallback for tests / SSR. */
export function createDefaultProjectLibrary(): ProjectLibrary {
  try {
    if (typeof localStorage !== 'undefined') {
      return new LocalStorageProjectLibrary(localStorage)
    }
  } catch {
    // ignore
  }
  return new MemoryProjectLibrary()
}
