import { useState } from 'react'
import { isSelected, type Selection } from '../../domain'
import { isoProject } from '../../render'
import type { DemoProjectSnapshot } from '../demo/syntheticProject'

type Props = {
  snapshot: DemoProjectSnapshot
  selection: Selection
  onSelect: (selection: Selection) => void
}

/** Interactive isometric 3D from engineered coordinates (not AI imagery). */
export function View3D({ snapshot, selection, onSelect }: Props) {
  const [yaw, setYaw] = useState(-0.6)
  const { section, fitting, paths, inputs } = snapshot
  const s = 0.08
  const originX = 260
  const originY = 200

  const trayPts = [
    isoProject(0, -inputs.usableWidthMm / 2, 0, yaw),
    isoProject(inputs.straightLengthMm, -inputs.usableWidthMm / 2, 0, yaw),
    isoProject(inputs.straightLengthMm, inputs.usableWidthMm / 2, 0, yaw),
    isoProject(0, inputs.usableWidthMm / 2, 0, yaw),
  ]

  return (
    <section className="view" aria-label="3D view">
      <header className="view__head">
        <h2>3D</h2>
        <p>Engineered isometric · drag slider to orbit</p>
      </header>
      <label className="orbit">
        Orbit
        <input
          type="range"
          min={-1.2}
          max={1.2}
          step={0.02}
          value={yaw}
          onChange={(e) => setYaw(Number(e.target.value))}
        />
      </label>
      <svg
        className="view__svg view__svg--tall"
        viewBox="0 0 520 320"
        role="img"
        aria-label="Isometric containment model"
      >
        <polygon
          points={trayPts
            .map((p) => `${originX + p.x * s},${originY + p.y * s}`)
            .join(' ')}
          className={
            isSelected(selection, 'section', section.id)
              ? 'mesh3d mesh3d--selected'
              : 'mesh3d'
          }
          onClick={() => onSelect({ kind: 'section', id: section.id })}
        />
        <text x={24} y={28} className="svg-label">
          Render mesh (simplified) — validation uses envelope separately
        </text>

        {/* Fitting marker at bend */}
        {(() => {
          const p = isoProject(
            inputs.straightLengthMm + inputs.bendRadiusMm * 0.5,
            0,
            0,
            yaw,
          )
          return (
            <circle
              cx={originX + p.x * s}
              cy={originY + p.y * s}
              r={isSelected(selection, 'fitting', fitting.id) ? 10 : 7}
              className="fit3d"
              onClick={() => onSelect({ kind: 'fitting', id: fitting.id })}
            />
          )
        })()}

        {paths.map((path, idx) => {
          const color = idx === 0 ? '#2f5d50' : '#8a4b2c'
          const selected = isSelected(selection, 'cable', path.cableInstanceId)
          const samples: Array<{ x: number; y: number }> = []
          for (let t = 0; t <= 1; t += 0.1) {
            const x = inputs.straightLengthMm * t
            const lat = (idx - 0.5) * 30
            samples.push(isoProject(x, lat, 8, yaw))
          }
          for (let a = 0; a <= Math.PI / 2; a += Math.PI / 18) {
            const x = inputs.straightLengthMm + inputs.bendRadiusMm * Math.sin(a)
            const y = inputs.bendRadiusMm * (1 - Math.cos(a))
            const lat = (idx - 0.5) * 30
            samples.push(isoProject(x, lat + y * 0.15, 8, yaw))
          }
          const d = samples
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${originX + p.x * s} ${originY + p.y * s}`)
            .join(' ')
          return (
            <path
              key={path.cableInstanceId}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={selected ? 4 : 2.5}
              onClick={() =>
                onSelect({ kind: 'cable', id: path.cableInstanceId })
              }
            />
          )
        })}
      </svg>
    </section>
  )
}
