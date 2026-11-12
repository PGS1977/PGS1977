import {
  filterSourcesByManufacturerIds,
  getManufacturer,
  structuredCatalogueLabel,
} from '../../domain'
import type { DesignBasis } from '../../storage'
import type { DemoCable, DemoProjectInputs } from '../../project/syntheticProject'

type Props = {
  designBasis: DesignBasis
  inputs: DemoProjectInputs
  onInputsChange: (inputs: DemoProjectInputs) => void
}

/**
 * Cable schedule / product picker filtered by design-basis manufacturer selection.
 * Incomplete makers show as unavailable for pick (no invented rows).
 */
export function CableProductPicker({
  designBasis,
  inputs,
  onInputsChange,
}: Props) {
  const cableSources = filterSourcesByManufacturerIds(
    designBasis.productSources,
    designBasis.selectedCableManufacturerIds,
    'cable',
  )
  const pickable = cableSources.filter(
    (s) => s.structuredDataStatus === 'fixture' || s.structuredDataStatus === 'verified_available',
  )
  const incomplete = cableSources.filter(
    (s) =>
      s.structuredDataStatus === 'incomplete' ||
      s.structuredDataStatus === 'partial',
  )

  function setCableManufacturer(cableId: string, manufacturerId: string) {
    onInputsChange({
      ...inputs,
      cables: inputs.cables.map((c) =>
        c.id === cableId ? { ...c, manufacturerId } : c,
      ),
    })
  }

  const selectedMakerOptions = designBasis.selectedCableManufacturerIds
    .map((id) => getManufacturer(id))
    .filter((m): m is NonNullable<typeof m> => m != null)

  return (
    <section className="view view--list" aria-label="Cable product picker">
      <header className="view__head">
        <h2>Cable schedule / manufacturer</h2>
        <p>
          Filtered by design-basis selection · incomplete catalogues cannot be
          picked as verified products
        </p>
      </header>

      <table className="weight-table">
        <thead>
          <tr>
            <th scope="col">Cable</th>
            <th scope="col">Manufacturer</th>
            <th scope="col">Catalogue</th>
          </tr>
        </thead>
        <tbody>
          {inputs.cables.map((cable: DemoCable) => {
            const maker = getManufacturer(cable.manufacturerId)
            const inScope = designBasis.selectedCableManufacturerIds.includes(
              cable.manufacturerId,
            )
            return (
              <tr key={cable.id}>
                <td>{cable.reference}</td>
                <td>
                  <select
                    aria-label={`Manufacturer for ${cable.reference}`}
                    value={cable.manufacturerId}
                    onChange={(e) =>
                      setCableManufacturer(cable.id, e.target.value)
                    }
                  >
                    {selectedMakerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName}
                        {m.structuredStatus === 'incomplete'
                          ? ' (incomplete)'
                          : ''}
                      </option>
                    ))}
                    {!inScope ? (
                      <option value={cable.manufacturerId}>
                        {maker?.displayName ?? cable.manufacturerId} (out of
                        scope)
                      </option>
                    ) : null}
                  </select>
                </td>
                <td>
                  {maker ? (
                    <span
                      className={`catalogue-badge catalogue-badge--${maker.structuredStatus}`}
                    >
                      {structuredCatalogueLabel(maker.structuredStatus)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="picker-status">
        <p>
          Pickable structured sources:{' '}
          {pickable.length === 0
            ? 'none yet (fixtures or verified only)'
            : pickable.map((s) => s.manufacturer).join(', ')}
        </p>
        {incomplete.length > 0 ? (
          <p role="status">
            Incomplete / partial (not pickable as verified):{' '}
            {incomplete.map((s) => s.manufacturer).join(', ')}
          </p>
        ) : null}
      </div>
    </section>
  )
}
