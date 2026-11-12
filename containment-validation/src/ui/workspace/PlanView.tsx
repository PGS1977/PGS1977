import { isSelected, type Selection } from '../../domain'
import type { DemoProjectSnapshot } from '../../project/syntheticProject'

type Props = {
  snapshot: DemoProjectSnapshot
  selection: Selection
  onSelect: (selection: Selection) => void
}

/** Plan view: straight run + horizontal 90° bend (engineered SVG paths). */
export function PlanView({ snapshot, selection, onSelect }: Props) {
  const { section, fitting, paths, inputs } = snapshot
  const scale = 0.12
  const pad = 40

  return (
    <section className="view" aria-label="Plan view">
      <header className="view__head">
        <h2>Plan</h2>
        <p>Straight + horizontal 90° · engineered centre paths</p>
      </header>
      <svg
        className="view__svg"
        viewBox={`0 0 520 280`}
        role="img"
        aria-label="Plan of containment route"
      >
        {/* Tray centreline corridor (simplified render mesh, not validation envelope) */}
        <path
          d={`M ${pad} 80 H ${pad + inputs.straightLengthMm * scale} A ${inputs.bendRadiusMm * scale} ${inputs.bendRadiusMm * scale} 0 0 1 ${pad + inputs.straightLengthMm * scale + inputs.bendRadiusMm * scale} ${80 + inputs.bendRadiusMm * scale}`}
          fill="none"
          stroke="#9aa89a"
          strokeWidth={inputs.usableWidthMm * scale * 0.35}
          strokeLinecap="square"
          opacity={0.45}
        />
        <text x={pad} y={50} className="svg-label">
          Render mesh (simplified)
        </text>

        {/* Clickable section / fitting regions */}
        <rect
          x={pad}
          y={60}
          width={inputs.straightLengthMm * scale}
          height={40}
          className={
            isSelected(selection, 'section', section.id)
              ? 'hit hit--selected'
              : 'hit'
          }
          onClick={() => onSelect({ kind: 'section', id: section.id })}
        />
        <text x={pad + 8} y={150} className="svg-ref">
          {section.reference}
        </text>

        <circle
          cx={pad + inputs.straightLengthMm * scale + inputs.bendRadiusMm * scale * 0.3}
          cy={80 + inputs.bendRadiusMm * scale * 0.3}
          r={28}
          className={
            isSelected(selection, 'fitting', fitting.id)
              ? 'hit hit--selected'
              : 'hit'
          }
          onClick={() => onSelect({ kind: 'fitting', id: fitting.id })}
        />
        <text
          x={pad + inputs.straightLengthMm * scale}
          y={80 + inputs.bendRadiusMm * scale + 28}
          className="svg-ref"
        >
          {fitting.reference}
        </text>

        {paths.map((path, idx) => {
          const color = idx === 0 ? '#2f5d50' : '#8a4b2c'
          const selected = isSelected(selection, 'cable', path.cableInstanceId)
          const line = path.segments[0]
          const arc = path.segments[1]
          if (!line || line.kind !== 'line' || !arc || arc.kind !== 'arc') return null
          const x1 = pad + line.start.x * scale
          const y1 = 80 + (line.start.y - inputs.usableHeightMm / 2) * scale * 0.2
          const x2 = pad + line.end.x * scale
          const y2 = 80 + (line.end.y - inputs.usableHeightMm / 2) * scale * 0.2
          const r = arc.radiusMm * scale
          return (
            <g
              key={path.cableInstanceId}
              className={selected ? 'cable cable--selected' : 'cable'}
              onClick={() =>
                onSelect({ kind: 'cable', id: path.cableInstanceId })
              }
            >
              <path
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 0 1 ${x2 + r} ${y2 + r}`}
                fill="none"
                stroke={color}
                strokeWidth={selected ? 4 : 2.5}
              />
              <title>{path.cableInstanceId}</title>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
