import { useCallback, useEffect, useMemo, useState } from 'react'
import { createNewFixtureProject } from '../project/newProject'
import type { DemoProjectInputs } from '../project/syntheticProject'
import {
  createDefaultProjectLibrary,
  createProjectDocument,
  exportProjectJson,
  importProjectJson,
  MemoryProjectLibrary,
  type DesignBasis,
  type ProjectDocument,
  type ProjectLibrary,
  type ProjectSummary,
} from '../storage'
import { Dashboard } from './screens/Dashboard'
import { DesignBasisScreen } from './screens/DesignBasis'
import { ValidationWorkspace } from './workspace/ValidationWorkspace'

type Screen = 'dashboard' | 'design_basis' | 'workspace'

function downloadJson(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Milestone 1 shell — dashboard, design basis, linked workspace, save/export.
 */
export function AppShell() {
  const library: ProjectLibrary = useMemo(() => {
    try {
      return createDefaultProjectLibrary()
    } catch {
      return new MemoryProjectLibrary()
    }
  }, [])

  const [screen, setScreen] = useState<Screen>('dashboard')
  const [summaries, setSummaries] = useState<ProjectSummary[]>([])
  const [active, setActive] = useState<ProjectDocument | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const refreshList = useCallback(async () => {
    setSummaries(await library.list())
  }, [library])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  async function handleCreate() {
    const doc = createNewFixtureProject()
    await library.save(doc)
    setActive(doc)
    await refreshList()
    setScreen('design_basis')
    setStatusMessage(`Created ${doc.project.projectNumber}`)
  }

  async function handleOpen(id: string) {
    const doc = await library.get(id)
    if (!doc) {
      setStatusMessage(`Project not found: ${id}`)
      return
    }
    setActive(doc)
    setScreen('design_basis')
    setStatusMessage(`Opened ${doc.project.projectNumber}`)
  }

  async function persist(doc: ProjectDocument) {
    const next = createProjectDocument({
      project: doc.project,
      designBasis: doc.designBasis,
      calculationInputs: doc.calculationInputs,
    })
    await library.save(next)
    setActive(next)
    await refreshList()
    return next
  }

  async function handleSave() {
    if (!active) return
    const saved = await persist(active)
    setStatusMessage(`Saved ${saved.project.projectNumber} (${saved.evidence.inputHash})`)
  }

  async function handleExport(id?: string) {
    const targetId = id ?? active?.project.id
    if (!targetId) return
    // Ensure active edits are included when exporting the open project.
    if (active && active.project.id === targetId) {
      const saved = await persist(active)
      downloadJson(
        `${saved.project.projectNumber}-${saved.project.revision}.json`,
        exportProjectJson(saved),
      )
      setStatusMessage(`Exported ${saved.project.projectNumber}`)
      return
    }
    const json = await library.exportJson(targetId)
    const doc = importProjectJson(json)
    downloadJson(
      `${doc.project.projectNumber}-${doc.project.revision}.json`,
      json,
    )
    setStatusMessage(`Exported ${doc.project.projectNumber}`)
  }

  async function handleImportFile(file: File) {
    const text = await file.text()
    const doc = await library.importJson(text)
    setActive(doc)
    await refreshList()
    setScreen('design_basis')
    setStatusMessage(`Imported ${doc.project.projectNumber}`)
  }

  async function handleRemove(id: string) {
    await library.remove(id)
    if (active?.project.id === id) {
      setActive(null)
      setScreen('dashboard')
    }
    await refreshList()
    setStatusMessage(`Deleted project ${id}`)
  }

  function handleDesignBasisChange(next: {
    designBasis: DesignBasis
    calculationInputs: DemoProjectInputs
    project: ProjectDocument['project']
  }) {
    if (!active) return
    setActive(
      createProjectDocument({
        project: next.project,
        designBasis: next.designBasis,
        calculationInputs: next.calculationInputs,
        updatedAt: active.updatedAt,
      }),
    )
  }

  function handleInputsChange(inputs: DemoProjectInputs) {
    if (!active) return
    setActive(
      createProjectDocument({
        project: active.project,
        designBasis: {
          ...active.designBasis,
          spareTargetPercent: inputs.spareTargetPercent,
          arrangementMode: inputs.arrangementMode,
          spacedMultiplier: inputs.spacedMultiplier,
        },
        calculationInputs: inputs,
        updatedAt: active.updatedAt,
      }),
    )
  }

  return (
    <main className="shell shell--wide">
      <nav className="app-nav" aria-label="Primary">
        <button
          type="button"
          className={screen === 'dashboard' ? 'app-nav__active' : undefined}
          onClick={() => setScreen('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={screen === 'design_basis' ? 'app-nav__active' : undefined}
          disabled={!active}
          onClick={() => setScreen('design_basis')}
        >
          Design basis
        </button>
        <button
          type="button"
          className={screen === 'workspace' ? 'app-nav__active' : undefined}
          disabled={!active}
          onClick={() => setScreen('workspace')}
        >
          Validation
        </button>
      </nav>

      {statusMessage ? (
        <p className="app-status" role="status">
          {statusMessage}
        </p>
      ) : null}

      {screen === 'dashboard' ? (
        <Dashboard
          projects={summaries}
          onCreate={() => void handleCreate()}
          onOpen={(id) => void handleOpen(id)}
          onExport={(id) => void handleExport(id)}
          onImportFile={(file) => void handleImportFile(file)}
          onRemove={(id) => void handleRemove(id)}
        />
      ) : null}

      {screen === 'design_basis' && active ? (
        <DesignBasisScreen
          document={active}
          onChange={handleDesignBasisChange}
          onOpenWorkspace={() => setScreen('workspace')}
          onSave={() => void handleSave()}
        />
      ) : null}

      {screen === 'workspace' && active ? (
        <ValidationWorkspace
          document={active}
          onInputsChange={handleInputsChange}
          onSave={() => void handleSave()}
          onExport={() => void handleExport()}
        />
      ) : null}
    </main>
  )
}
