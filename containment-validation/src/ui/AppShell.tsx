import { ValidationWorkspace } from './workspace/ValidationWorkspace'

/**
 * Milestone 1 shell — Increment D linked validation workspace.
 * No simulated pass/fail; statuses come from pure engine calls.
 */
export function AppShell() {
  return (
    <main className="shell shell--wide">
      <ValidationWorkspace />
    </main>
  )
}
