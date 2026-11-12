import {
  getManufacturer,
  isSelected,
  type Selection,
} from '../../domain'
import type { DemoProjectSnapshot } from '../../project/syntheticProject'
import { StatusBadge } from './statusBadge'

type Props = {
  snapshot: DemoProjectSnapshot
  selection: Selection
  onSelect: (selection: Selection) => void
  selectedCableManufacturerIds?: readonly string[]
}

export function WeightSchedule({
  snapshot,
  selection,
  onSelect,
  selectedCableManufacturerIds,
}: Props) {
  const { weight, structural, inputs } = snapshot
  const scope = selectedCableManufacturerIds
    ? new Set(selectedCableManufacturerIds)
    : null

  const contributions = weight.contributions.filter((c) => {
    if (!scope) return true
    const meta = inputs.cables.find((x) => x.id === c.cableInstanceId)
    if (!meta) return true
    return scope.has(meta.manufacturerId)
  })

  return (
    <section className="view view--list" aria-label="Weight schedule">
      <header className="view__head">
        <h2>Weight schedule</h2>
        <p>Missing mass ≠ 0 · structural deferred · filtered by manufacturer</p>
      </header>
      <table className="weight-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Maker</th>
            <th scope="col">kg/m</th>
            <th scope="col">Length (m)</th>
            <th scope="col">kg</th>
          </tr>
        </thead>
        <tbody>
          {contributions.map((c) => {
            const meta = inputs.cables.find((x) => x.id === c.cableInstanceId)
            const maker = meta
              ? getManufacturer(meta.manufacturerId)
              : undefined
            return (
              <tr
                key={c.cableInstanceId}
                className={
                  isSelected(selection, 'cable', c.cableInstanceId)
                    ? 'row--selected'
                    : undefined
                }
                onClick={() =>
                  onSelect({ kind: 'cable', id: c.cableInstanceId })
                }
              >
                <td>{meta?.reference ?? c.cableInstanceId}</td>
                <td>{maker?.displayName ?? meta?.manufacturerId ?? '—'}</td>
                <td>{c.massKnown ? c.massKgPerM : '—'}</td>
                <td>{c.lengthM.toFixed(3)}</td>
                <td>{c.contributionKg != null ? c.contributionKg.toFixed(3) : 'unknown'}</td>
              </tr>
            )
          })}
          <tr
            className={
              isSelected(selection, 'section', snapshot.section.id)
                ? 'row--selected'
                : undefined
            }
            onClick={() =>
              onSelect({ kind: 'section', id: snapshot.section.id })
            }
          >
            <td>Containment + accessories</td>
            <td>—</td>
            <td>—</td>
            <td>—</td>
            <td>
              {weight.containmentAndAccessoriesKg != null
                ? weight.containmentAndAccessoriesKg.toFixed(3)
                : 'unknown'}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Known cable subtotal</th>
            <td colSpan={3} />
            <td>{weight.knownCableSubtotalKg.toFixed(3)}</td>
          </tr>
          <tr>
            <th scope="row">Combined installed</th>
            <td colSpan={3} />
            <td>
              {weight.combinedInstalledKg != null
                ? `${weight.combinedInstalledKg.toFixed(3)} kg`
                : 'incomplete'}
            </td>
          </tr>
        </tfoot>
      </table>
      <div className="structural-panel">
        <StatusBadge status={structural.status} />
        <span>
          Support spans / structural loading: deferred — weight remains available
          (AC16). {structural.evidence}
        </span>
      </div>
    </section>
  )
}
