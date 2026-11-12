import type { Selection, ValidationResult } from '../../domain'
import { StatusBadge } from './statusBadge'

type Props = {
  results: ValidationResult[]
  selection: Selection
  onSelect: (selection: Selection) => void
}

export function IssueList({ results, selection, onSelect }: Props) {
  return (
    <section className="view view--list" aria-label="Issue list">
      <header className="view__head">
        <h2>Issues / results</h2>
        <p>Colour + text + symbol · live engine evidence</p>
      </header>
      <ul className="issue-list">
        {results.map((r) => {
          const selected =
            (selection.kind === 'issue' && selection.id === r.id) ||
            (selection.kind === 'cable' &&
              r.cableId != null &&
              selection.id === r.cableId) ||
            ((selection.kind === 'section' || selection.kind === 'fitting') &&
              r.sectionOrFittingId != null &&
              selection.id === r.sectionOrFittingId)

          return (
            <li key={r.id}>
              <button
                type="button"
                className={selected ? 'issue issue--selected' : 'issue'}
                onClick={() => {
                  if (r.cableId) {
                    onSelect({ kind: 'cable', id: r.cableId })
                  } else if (r.sectionOrFittingId) {
                    const kind = r.sectionOrFittingId.startsWith('fit')
                      ? 'fitting'
                      : 'section'
                    onSelect({ kind, id: r.sectionOrFittingId })
                  } else {
                    onSelect({ kind: 'issue', id: r.id })
                  }
                }}
              >
                <StatusBadge status={r.status} />
                <span className="issue__check">{r.check}</span>
                <span className="issue__code">{r.issueCode}</span>
                <span className="issue__evidence">{r.evidence}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
