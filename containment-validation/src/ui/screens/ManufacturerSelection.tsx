import {
  filterSourcesByManufacturerIds,
  getManufacturer,
  manufacturerConstraintLabel,
  manufacturersForKind,
  structuredCatalogueLabel,
  toggleManufacturerId,
  type ManufacturerKind,
} from '../../domain'
import type { DesignBasis } from '../../storage'

type Props = {
  designBasis: DesignBasis
  onChange: (partial: Partial<DesignBasis>) => void
}

function ManufacturerGroup({
  kind,
  title,
  selectedIds,
  onToggle,
  productSources,
}: {
  kind: ManufacturerKind
  title: string
  selectedIds: readonly string[]
  onToggle: (id: string) => void
  productSources: DesignBasis['productSources']
}) {
  const makers = manufacturersForKind(kind)
  const visibleSources = filterSourcesByManufacturerIds(
    productSources,
    selectedIds,
    kind,
  )

  return (
    <section className="maker-group" aria-label={title}>
      <h3 className="screen__sub">{title}</h3>
      <p className="maker-group__hint">
        Multi-select. Incomplete catalogues stay incomplete — no invented
        dimensions. Future makers are added to the registry as sources arrive.
      </p>
      <ul className="maker-list">
        {makers.map((m) => {
          const checked = selectedIds.includes(m.id)
          const status = structuredCatalogueLabel(m.structuredStatus)
          return (
            <li key={m.id} className="maker-list__item">
              <label className="maker-list__label">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(m.id)}
                />
                <span className="maker-list__name">{m.displayName}</span>
                <span
                  className={`catalogue-badge catalogue-badge--${m.structuredStatus}`}
                >
                  {status}
                </span>
              </label>
              {m.constraints.length > 0 ? (
                <div className="maker-list__constraints">
                  {m.constraints.map((c) => (
                    <span key={c} className="constraint-chip">
                      {manufacturerConstraintLabel(c)}
                    </span>
                  ))}
                </div>
              ) : null}
              {m.notes ? (
                <div className="maker-list__note">{m.notes}</div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <h4 className="maker-group__sources-title">
        Product sources for selected {kind} makers
      </h4>
      {visibleSources.length === 0 ? (
        <p className="maker-group__empty" role="status">
          No product sources in scope — select a manufacturer above, or wait for
          structured catalogue intake.
        </p>
      ) : (
        <ul className="source-list">
          {visibleSources.map((s) => {
            const maker = getManufacturer(s.manufacturerId)
            return (
              <li key={s.id}>
                <span className={`prov prov--${s.provenance}`}>
                  {s.provenance.toUpperCase()}
                </span>
                <span
                  className={`catalogue-badge catalogue-badge--${s.structuredDataStatus}`}
                >
                  {structuredCatalogueLabel(s.structuredDataStatus)}
                </span>
                <strong>{s.manufacturer}</strong> · {s.sourceFileOrReference} ·
                rev {s.revision}
                <div className="source-list__note">
                  {maker?.displayName ?? s.manufacturerId}
                  {s.notes ? ` — ${s.notes}` : ''}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/**
 * Design-basis manufacturer selection for cables and containment.
 * Filters product sources by selected maker; preserves provenance labels.
 */
export function ManufacturerSelection({ designBasis, onChange }: Props) {
  const cableIds = designBasis.selectedCableManufacturerIds
  const containmentIds = designBasis.selectedContainmentManufacturerIds

  return (
    <div className="maker-selection">
      <ManufacturerGroup
        kind="cable"
        title="Cable manufacturers"
        selectedIds={cableIds}
        productSources={designBasis.productSources}
        onToggle={(id) =>
          onChange({
            selectedCableManufacturerIds: toggleManufacturerId(cableIds, id),
          })
        }
      />
      <ManufacturerGroup
        kind="containment"
        title="Containment manufacturers"
        selectedIds={containmentIds}
        productSources={designBasis.productSources}
        onToggle={(id) =>
          onChange({
            selectedContainmentManufacturerIds: toggleManufacturerId(
              containmentIds,
              id,
            ),
          })
        }
      />
    </div>
  )
}
