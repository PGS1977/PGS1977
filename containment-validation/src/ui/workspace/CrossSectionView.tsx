import { isSelected, type Selection } from '../../domain'
import type { DemoProjectSnapshot } from '../../project/syntheticProject'

type Props = {
  snapshot: DemoProjectSnapshot
  selection: Selection
  onSelect: (selection: Selection) => void
}

/** Cross-section: render mesh vs validation envelope + placed cable circles. */
export function CrossSectionView({ snapshot, selection, onSelect }: Props) {
  const { geometry, arrangement, section, inputs } = snapshot
  const scale = 2.2
  const ox = 36
  const oy = 36

  const mesh = geometry.mesh.outline
  const env = geometry.envelope.rect
  const maxX = Math.max(...mesh.map((p) => p.x)) * scale + ox + 40
  const maxY = Math.max(...mesh.map((p) => p.y)) * scale + oy + 40

  return (
    <section className="view" aria-label="Cross-section view">
      <header className="view__head">
        <h2>Cross-section</h2>
        <p>
          Envelope separate from mesh · spare{' '}
          {snapshot.area.sparePercent != null
            ? `${snapshot.area.sparePercent.toFixed(2)}%`
            : 'n/a'}
        </p>
      </header>
      <svg
        className="view__svg"
        viewBox={`0 0 ${maxX} ${maxY}`}
        role="img"
        aria-label="Containment cross-section"
      >
        <polygon
          points={mesh
            .map((p) => `${ox + p.x * scale},${oy + p.y * scale}`)
            .join(' ')}
          className="mesh-fill"
          onClick={() => onSelect({ kind: 'section', id: section.id })}
        />
        <rect
          x={ox + env.x * scale}
          y={oy + env.y * scale}
          width={env.width * scale}
          height={env.height * scale}
          className={
            isSelected(selection, 'section', section.id)
              ? 'envelope envelope--selected'
              : 'envelope'
          }
          onClick={() => onSelect({ kind: 'section', id: section.id })}
        />
        <text x={ox} y={18} className="svg-label">
          Validation envelope (dashed)
        </text>
        <text x={ox} y={maxY - 8} className="svg-ref">
          {section.reference} · usable {inputs.usableWidthMm}×{inputs.usableHeightMm} mm
        </text>

        {arrangement.placements.map((p, idx) => {
          const selected = isSelected(selection, 'cable', p.cableInstanceId)
          const color = idx === 0 ? '#2f5d50' : '#8a4b2c'
          return (
            <g
              key={p.cableInstanceId}
              onClick={() => onSelect({ kind: 'cable', id: p.cableInstanceId })}
            >
              <circle
                cx={ox + (env.x + p.centreXMm) * scale}
                cy={oy + (env.y + p.centreYMm) * scale}
                r={(p.outsideDiameterMm / 2) * scale}
                fill={color}
                fillOpacity={selected ? 0.9 : 0.55}
                stroke={selected ? '#111' : color}
                strokeWidth={selected ? 2.5 : 1}
              />
              <text
                x={ox + (env.x + p.centreXMm) * scale}
                y={oy + (env.y + p.centreYMm) * scale + 4}
                textAnchor="middle"
                className="svg-cable-id"
              >
                {p.cableInstanceId.replace('cable-synth-', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
