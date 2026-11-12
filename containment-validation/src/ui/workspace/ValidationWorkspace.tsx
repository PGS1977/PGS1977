import { useMemo, useState } from 'react'
import {
  EMPTY_SELECTION,
  provenanceLabel,
  PROVENANCE,
  type Selection,
} from '../../domain'
import { anyStale } from '../../engine'
import {
  applyInputChangeKeepingPriorResults,
  buildDemoSnapshot,
  DEFAULT_DEMO_INPUTS,
  type DemoProjectInputs,
} from '../demo/syntheticProject'
import { CrossSectionView } from './CrossSectionView'
import { IssueList } from './IssueList'
import { PlanView } from './PlanView'
import { StatusBadge } from './statusBadge'
import { View3D } from './View3D'
import { WeightSchedule } from './WeightSchedule'

/**
 * Linked validation workspace (brief §7 item 5).
 * Selection is shared across plan, cross-section, 3D, issues and weights.
 * All statuses come from pure engine calls on synthetic fixtures.
 */
export function ValidationWorkspace() {
  const [inputs, setInputs] = useState<DemoProjectInputs>(DEFAULT_DEMO_INPUTS)
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION)
  const [stalePreview, setStalePreview] = useState<ReturnType<
    typeof applyInputChangeKeepingPriorResults
  > | null>(null)

  const snapshot = useMemo(() => buildDemoSnapshot(inputs), [inputs])
  const displayedResults = stalePreview?.stalePriorResults ?? snapshot.results

  const selectionLabel =
    selection.kind === 'none' || selection.id == null
      ? 'Nothing selected — click a cable, section, fitting or issue'
      : `${selection.kind}: ${selection.id}`

  function bumpSpareTarget() {
    // AC10 demo: changing a rule marks prior results stale, then refresh clears it.
    const prior = buildDemoSnapshot(inputs)
    const next: DemoProjectInputs = {
      ...inputs,
      spareTargetPercent: inputs.spareTargetPercent === 25 ? 30 : 25,
    }
    const applied = applyInputChangeKeepingPriorResults(prior, next)
    setStalePreview(applied)
    setInputs(next)
  }

  function clearStaleByRecalc() {
    setStalePreview(null)
  }

  function toggleSpacing() {
    const prior = buildDemoSnapshot(inputs)
    const next: DemoProjectInputs = {
      ...inputs,
      arrangementMode: inputs.arrangementMode === 'touching' ? 'spaced' : 'touching',
      spacedMultiplier: 1,
    }
    setStalePreview(applyInputChangeKeepingPriorResults(prior, next))
    setInputs(next)
  }

  return (
    <div className="workspace">
      <section className="shell__banner" role="status">
        <strong>Production catalogue incomplete.</strong>{' '}
        {provenanceLabel(PROVENANCE.fixture)}. Linked views use synthetic fixture
        geometry only — never hard-coded 150/300 mm pass/fail.
      </section>

      <div className="workspace__toolbar">
        <div>
          <p className="workspace__brand">Containment Validation</p>
          <p className="workspace__tag">
            Developed By Designers For Designers · linked workspace
          </p>
        </div>
        <div className="workspace__actions">
          <button type="button" onClick={bumpSpareTarget}>
            Change spare target (stale demo)
          </button>
          <button type="button" onClick={toggleSpacing}>
            Toggle touching / spaced
          </button>
          <button type="button" onClick={clearStaleByRecalc} disabled={!stalePreview}>
            Accept recalculation
          </button>
        </div>
      </div>

      <p className="workspace__selection" aria-live="polite">
        <strong>Linked selection:</strong> {selectionLabel}
        {anyStale(displayedResults) ? (
          <>
            {' '}
            · <StatusBadge status="STALE" /> prior results pending accept
          </>
        ) : null}
      </p>

      <div className="workspace__grid">
        <PlanView
          snapshot={snapshot}
          selection={selection}
          onSelect={setSelection}
        />
        <CrossSectionView
          snapshot={snapshot}
          selection={selection}
          onSelect={setSelection}
        />
        <View3D
          snapshot={snapshot}
          selection={selection}
          onSelect={setSelection}
        />
        <IssueList
          results={displayedResults}
          selection={selection}
          onSelect={setSelection}
        />
        <WeightSchedule
          snapshot={snapshot}
          selection={selection}
          onSelect={setSelection}
        />
      </div>

      <p className="workspace__hash">
        Input hash <code>{snapshot.inputHash}</code> · arrangement{' '}
        <StatusBadge status={snapshot.arrangement.status} /> · area{' '}
        <StatusBadge status={snapshot.area.status} /> · assumptions:{' '}
        {snapshot.arrangement.assumptions.join('; ') || 'none'}
      </p>
    </div>
  )
}
