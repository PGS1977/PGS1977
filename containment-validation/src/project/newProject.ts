import { DEFAULT_DEMO_INPUTS } from './syntheticProject'
import {
  createProjectDocument,
  defaultDesignBasisFromInputs,
  type ProjectDocument,
} from '../storage'

let seq = 1

export function createNewFixtureProject(args?: {
  name?: string
  projectNumber?: string
  designer?: string
}): ProjectDocument {
  const n = seq++
  const inputs = structuredClone(DEFAULT_DEMO_INPUTS)
  return createProjectDocument({
    project: {
      id: `proj-synth-${String(n).padStart(3, '0')}`,
      projectNumber: args?.projectNumber ?? `PGS-M1-${String(n).padStart(3, '0')}`,
      name: args?.name ?? `Synthetic containment check ${n}`,
      clientSite: 'Fixture site',
      stage: 'PoC',
      designer: args?.designer ?? 'Designer',
      displayUnits: 'metric',
      revision: 'A',
    },
    designBasis: defaultDesignBasisFromInputs(inputs),
    calculationInputs: inputs,
  })
}
