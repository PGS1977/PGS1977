import { provenanceLabel, type ProvenanceStatus } from '../../domain'
import type { DesignBasis, ProjectDocument } from '../../storage'
import type { DemoProjectInputs } from '../../project/syntheticProject'

type Props = {
  document: ProjectDocument
  onChange: (next: {
    designBasis: DesignBasis
    calculationInputs: DemoProjectInputs
    project: ProjectDocument['project']
  }) => void
  onOpenWorkspace: () => void
  onSave: () => void
}

export function DesignBasisScreen({
  document,
  onChange,
  onOpenWorkspace,
  onSave,
}: Props) {
  const { designBasis, calculationInputs, project } = document

  function patchBasis(partial: Partial<DesignBasis>) {
    const nextBasis = { ...designBasis, ...partial }
    const nextInputs: DemoProjectInputs = {
      ...calculationInputs,
      spareTargetPercent:
        partial.spareTargetPercent ?? calculationInputs.spareTargetPercent,
      arrangementMode:
        partial.arrangementMode === 'stacked'
          ? calculationInputs.arrangementMode
          : (partial.arrangementMode as DemoProjectInputs['arrangementMode']) ??
            calculationInputs.arrangementMode,
      spacedMultiplier:
        partial.spacedMultiplier ?? calculationInputs.spacedMultiplier,
    }
    onChange({
      designBasis: nextBasis,
      calculationInputs: nextInputs,
      project: {
        ...project,
        displayUnits: nextBasis.displayUnits,
      },
    })
  }

  return (
    <section className="screen" aria-label="Design basis">
      <header className="screen__head">
        <h1>Design basis</h1>
        <p>
          {project.projectNumber} · {project.name} · rev {project.revision}
        </p>
      </header>

      <section className="shell__banner" role="status">
        Catalogue state: <strong>{designBasis.catalogueState}</strong>. Product
        sources below are labelled fixture / assumed / verified — fixtures never
        claim manufacturer verification.
      </section>

      <div className="basis-grid">
        <label>
          Display units
          <select
            value={designBasis.displayUnits}
            onChange={(e) =>
              patchBasis({
                displayUnits: e.target.value as DesignBasis['displayUnits'],
              })
            }
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial (display preference)</option>
          </select>
        </label>

        <label>
          Spare target (%)
          <input
            type="number"
            min={0}
            max={99.999}
            step={0.1}
            value={designBasis.spareTargetPercent}
            onChange={(e) =>
              patchBasis({ spareTargetPercent: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Arrangement
          <select
            value={designBasis.arrangementMode}
            onChange={(e) => {
              const mode = e.target.value as DesignBasis['arrangementMode']
              if (mode === 'stacked') {
                patchBasis({
                  arrangementMode: mode,
                  stackedLayerCount: designBasis.stackedLayerCount ?? 2,
                  stackedVerticalGapMm: designBasis.stackedVerticalGapMm ?? 5,
                })
              } else {
                patchBasis({ arrangementMode: mode })
              }
            }}
          >
            <option value="touching">Touching</option>
            <option value="spaced">Spaced</option>
            <option value="stacked">Stacked</option>
          </select>
        </label>

        {designBasis.arrangementMode === 'spaced' ? (
          <label>
            Spaced multiplier (1 = 1D, 2 = 2D, custom)
            <input
              type="number"
              min={0.01}
              step={0.1}
              value={designBasis.spacedMultiplier ?? 1}
              onChange={(e) =>
                patchBasis({ spacedMultiplier: Number(e.target.value) })
              }
            />
          </label>
        ) : null}

        {designBasis.arrangementMode === 'stacked' ? (
          <>
            <label>
              Stacked layer count
              <input
                type="number"
                min={1}
                step={1}
                value={designBasis.stackedLayerCount ?? 2}
                onChange={(e) =>
                  patchBasis({ stackedLayerCount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Vertical gap (mm)
              <input
                type="number"
                min={0}
                step={1}
                value={designBasis.stackedVerticalGapMm ?? 5}
                onChange={(e) =>
                  patchBasis({ stackedVerticalGapMm: Number(e.target.value) })
                }
              />
            </label>
          </>
        ) : null}
      </div>

      <h2 className="screen__sub">Product sources</h2>
      <ul className="source-list">
        {designBasis.productSources.map((s) => (
          <li key={s.id}>
            <span className={`prov prov--${s.provenance}`}>
              {(s.provenance as ProvenanceStatus).toUpperCase()}
            </span>
            <strong>{s.manufacturer}</strong> · {s.sourceFileOrReference} · rev{' '}
            {s.revision}
            <div className="source-list__note">
              {provenanceLabel(s.provenance)}
              {s.notes ? ` — ${s.notes}` : ''}
            </div>
          </li>
        ))}
      </ul>

      <h2 className="screen__sub">Assumptions</h2>
      <ul className="assumption-list">
        {designBasis.assumptions.map((a) => (
          <li key={a.id}>
            <code>{a.id}</code> [{a.status}] {a.summary}
          </li>
        ))}
      </ul>

      <div className="screen__actions">
        <button type="button" onClick={onSave}>
          Save project
        </button>
        <button type="button" onClick={onOpenWorkspace}>
          Open validation workspace
        </button>
      </div>
    </section>
  )
}
