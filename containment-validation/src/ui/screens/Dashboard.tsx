import { provenanceLabel, PROVENANCE } from '../../domain'
import type { ProjectSummary } from '../../storage'

type Props = {
  projects: ProjectSummary[]
  onCreate: () => void
  onOpen: (id: string) => void
  onExport: (id: string) => void
  onImportFile: (file: File) => void
  onRemove: (id: string) => void
}

export function Dashboard({
  projects,
  onCreate,
  onOpen,
  onExport,
  onImportFile,
  onRemove,
}: Props) {
  return (
    <section className="screen" aria-label="Dashboard">
      <header className="screen__head">
        <h1>Projects</h1>
        <p>Create or open a local proof-of-concept project. Brand: Developed By Designers For Designers.</p>
      </header>

      <section className="shell__banner" role="status">
        <strong>Production catalogue incomplete.</strong> Verified records under{' '}
        <code>data/verified/</code> are empty. {provenanceLabel(PROVENANCE.fixture)}.
      </section>

      <div className="screen__actions">
        <button type="button" onClick={onCreate}>
          Create project
        </button>
        <label className="file-btn">
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportFile(file)
              e.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      {projects.length === 0 ? (
        <p className="screen__empty">No saved projects yet. Create one to begin.</p>
      ) : (
        <table className="project-table">
          <thead>
            <tr>
              <th scope="col">Number</th>
              <th scope="col">Name</th>
              <th scope="col">Stage</th>
              <th scope="col">Rev</th>
              <th scope="col">Catalogue</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>{p.projectNumber}</td>
                <td>{p.name}</td>
                <td>{p.stage ?? '—'}</td>
                <td>{p.revision}</td>
                <td>
                  <span className={`cat cat--${p.catalogueState}`}>
                    {p.catalogueState}
                  </span>
                </td>
                <td>{new Date(p.updatedAt).toLocaleString()}</td>
                <td className="project-table__actions">
                  <button type="button" onClick={() => onOpen(p.id)}>
                    Open
                  </button>
                  <button type="button" onClick={() => onExport(p.id)}>
                    Export
                  </button>
                  <button type="button" onClick={() => onRemove(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
