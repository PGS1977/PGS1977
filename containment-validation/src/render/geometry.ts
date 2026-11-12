/**
 * Engineered geometry helpers (brief §7 / §8).
 * Validation envelope stays separate from simplified render mesh.
 */

export type RenderMesh2D = {
  /** Simplified tray outline for display (mm). */
  outline: Array<{ x: number; y: number }>
  kind: 'render_mesh'
}

export type ValidationEnvelope2D = {
  /** Accurate usable cable envelope for validation overlay (mm). */
  rect: { x: number; y: number; width: number; height: number }
  kind: 'validation_envelope'
}

/** Build a simplified outer mesh that is intentionally larger than the usable envelope. */
export function trayRenderMeshFromEnvelope(args: {
  usableWidthMm: number
  usableHeightMm: number
  wallMm?: number
}): { mesh: RenderMesh2D; envelope: ValidationEnvelope2D } {
  const wall = args.wallMm ?? 4
  const env = {
    x: wall,
    y: wall,
    width: args.usableWidthMm,
    height: args.usableHeightMm,
  }
  const outerW = args.usableWidthMm + wall * 2
  const outerH = args.usableHeightMm + wall * 2
  return {
    mesh: {
      kind: 'render_mesh',
      outline: [
        { x: 0, y: 0 },
        { x: outerW, y: 0 },
        { x: outerW, y: outerH },
        { x: 0, y: outerH },
      ],
    },
    envelope: { kind: 'validation_envelope', rect: env },
  }
}

/** Isometric projection of a 3D point (mm) → SVG coords. */
export function isoProject(
  x: number,
  y: number,
  z: number,
  yawRad: number,
): { x: number; y: number } {
  const cy = Math.cos(yawRad)
  const sy = Math.sin(yawRad)
  const rx = x * cy - y * sy
  const ry = x * sy + y * cy
  const isoX = (rx - ry) * Math.cos(Math.PI / 6)
  const isoY = (rx + ry) * Math.sin(Math.PI / 6) - z
  return { x: isoX, y: isoY }
}
