import type { ResultStatus } from '../../domain'

const LABELS: Record<ResultStatus, string> = {
  PASS: 'PASS',
  ERROR: 'ERROR',
  INCOMPLETE: 'INCOMPLETE',
  STALE: 'STALE',
  NOT_CHECKED: 'NOT_CHECKED',
}

export function StatusBadge({ status }: { status: ResultStatus }) {
  return (
    <span className={`status status--${status.toLowerCase()}`} title={LABELS[status]}>
      <span className="status__symbol" aria-hidden="true">
        {status === 'PASS'
          ? '●'
          : status === 'ERROR'
            ? '▲'
            : status === 'INCOMPLETE'
              ? '◇'
              : status === 'STALE'
                ? '◌'
                : '○'}
      </span>
      <span className="status__text">{LABELS[status]}</span>
    </span>
  )
}
