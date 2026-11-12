/**
 * Linked selection identity shared across plan, cross-section, 3D, issues, weights.
 */

export type SelectableKind = 'section' | 'fitting' | 'cable' | 'issue' | 'none'

export type Selection = {
  kind: SelectableKind
  id: string | null
}

export const EMPTY_SELECTION: Selection = { kind: 'none', id: null }

export function selectionEquals(a: Selection, b: Selection): boolean {
  return a.kind === b.kind && a.id === b.id
}

export function isSelected(
  selection: Selection,
  kind: SelectableKind,
  id: string,
): boolean {
  return selection.kind === kind && selection.id === id
}
