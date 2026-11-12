import { isSelected, type Selection } from '../../domain'
import type { DemoProjectSnapshot } from '../../project/syntheticProject'
import { StatusBadge } from './statusBadge'

type Props = {
  snapshot: DemoProjectSnapshot
  selection: Selection
  onSelect: (selection: Selection) => void
}

export function WeightSchedule({ snapshot, selection, onSelect }: Props) {
  const { weight, structural, inputs } = snapshot

  return (
    <section className="view view--list" aria-label="Weight schedule">
      <header className="view__head">
        <h2>Weight schedule</h2>
        <p>Missing mass ≠ 0 · structural deferred</p>
      </header>
      <table className="weight-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">kg/m</th>
            <th scope="col">Length (m)</th>
            <th scope="col">kg</th>
          </tr>
        </thead>
        <tbody>
          {weight.contributions.map((c) => {
            const meta = inputs.cables.find((x) => x.id === c.cableInstanceId)
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
            <td colSpan={2} />
            <td>{weight.knownCableSubtotalKg.toFixed(3)}</td>
          </tr>
          <tr>
            <th scope="row">Combined installed</th>
            <td colSpan={2} />
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
