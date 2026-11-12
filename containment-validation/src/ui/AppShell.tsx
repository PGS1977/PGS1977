import {
  PROVENANCE,
  provenanceLabel,
  RESULT_STATUS,
} from '../domain'
import {
  evaluateSpareArea,
  evaluateWeight,
  structuralSupportPanelResult,
  weightAvailableWithDeferredStructural,
} from '../engine'

/**
 * Minimal Milestone 1 shell — no simulated pass/fail mockup.
 * Demonstrates live pure-engine calls on synthetic numeric inputs only.
 */
export function AppShell() {
  // Synthetic arithmetic demonstration (AC01 numbers) — not product geometry.
  const areaDemo = evaluateSpareArea({
    envelopeAreaMm2: 10_000,
    cableAreasMm2: [7500],
    spareTargetPercent: 25,
  })

  const weightDemo = evaluateWeight({
    cables: [{ cableInstanceId: 'demo-c1', massKgPerM: 2, lengthM: 5 }],
    containmentAndAccessoriesKg: 3,
    containmentMassKnown: true,
  })

  const structural = structuralSupportPanelResult({
    id: 'struct-panel',
    inputRevisionOrHash: 'demo',
  })

  const paired = weightAvailableWithDeferredStructural(weightDemo)

  return (
    <main className="shell">
      <header className="shell__header">
        <p className="shell__brand">Containment Validation</p>
        <p className="shell__tagline">Developed By Designers For Designers</p>
      </header>

      <section className="shell__banner" role="status">
        <strong>Production catalogue incomplete.</strong>{' '}
        Verified Legrand/Prysmian records are not yet in{' '}
        <code>data/verified/</code>. Development uses labelled synthetic fixtures
        under <code>data/fixtures/</code> (
        {provenanceLabel(PROVENANCE.fixture)}). Nominal 150/300 mm widths are
        never hard-coded to pass or fail.
      </section>

      <section className="shell__panel">
        <h1>Increment A + B engine status</h1>
        <p>
          Schemas, units, statuses, provenance, spare-area and weight functions
          are available as pure TypeScript modules independent of React. Placement
          and bend checks are next.
        </p>
        <ul>
          <li>
            Area demo (synthetic AC01 inputs): status{' '}
            <code>{areaDemo.status}</code>, spare{' '}
            <code>{areaDemo.sparePercent}</code>%
          </li>
          <li>
            Weight demo (synthetic AC07 inputs): status{' '}
            <code>{weightDemo.status}</code>, combined{' '}
            <code>{weightDemo.combinedInstalledKg}</code> kg
          </li>
          <li>
            Structural panel (AC16): <code>{structural.status}</code> —{' '}
            {paired.note}
          </li>
          <li>
            Result vocabulary: {Object.values(RESULT_STATUS).join(' | ')}
          </li>
        </ul>
      </section>
    </main>
  )
}
