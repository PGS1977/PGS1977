# Repository scaffolding decisions

Appended when Increment A + B landed in `containment-validation/`.

| ID | Date | Topic | Decision | Status |
|---|---|---|---|---|
| R01 | 2026-11-12 | App location | Place app under `containment-validation/` to preserve root profile README | agreed |
| R02 | 2026-11-12 | Stack | TypeScript + React + Vite; Zod for runtime schemas; Vitest for AC tests; domain/engine independent of React | proposed → adopted for PoC |
| R03 | 2026-11-12 | Obstruction union | Axis-aligned rectangle sweep-line union for AC03; scalar obstruction areas only when geometry absent (caller must supply union for overlapping scalars) | proposed |
| R04 | 2026-11-12 | Fixture sizes | Synthetic tray uses nominal 200 mm (not 150/300) so demos cannot imply hard-coded width outcomes | agreed |
| R05 | 2026-11-12 | Deferred modules | Structural/support-span returns `NOT_CHECKED` (AC16); PDF/render stubs remain; placement/bend implemented in Increment C | agreed |
| R06 | 2026-11-12 | Placement search | Deterministic ID-sorted order + reverse + integer start-X offsets up to `searchLimit`; exhaustion → `ERROR_NO_VALID_ARRANGEMENT_FOUND` without impossibility claim | agreed |
| R07 | 2026-11-12 | Bend paths | Straight + horizontal 90° analytic line/arc; lateral offsets preserved as parallel bend radii across fitting ports | agreed |
| R08 | 2026-11-12 | Increment C branch | Stacked PR from `cursor/m1-schemas-area-weight-b66e` as `cursor/m1-placement-bend-b66e` | agreed |
| R09 | 2026-11-12 | Increment D 3D | Engineered SVG isometric with orbit control (no Three.js yet); validation envelope kept distinct from render mesh | agreed |
| R10 | 2026-11-12 | Linked selection | Single React selection state shared by plan, cross-section, 3D, issues, weight schedule | agreed |
| R11 | 2026-11-12 | Increment D branch | Stacked on C as `cursor/m1-linked-views-b66e` | agreed |
