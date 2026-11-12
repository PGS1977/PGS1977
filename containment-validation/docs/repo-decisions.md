# Repository scaffolding decisions

Appended when Increment A + B landed in `containment-validation/`.

| ID | Date | Topic | Decision | Status |
|---|---|---|---|---|
| R01 | 2026-11-12 | App location | Place app under `containment-validation/` to preserve root profile README | agreed |
| R02 | 2026-11-12 | Stack | TypeScript + React + Vite; Zod for runtime schemas; Vitest for AC tests; domain/engine independent of React | proposed → adopted for PoC |
| R03 | 2026-11-12 | Obstruction union | Axis-aligned rectangle sweep-line union for AC03; scalar obstruction areas only when geometry absent (caller must supply union for overlapping scalars) | proposed |
| R04 | 2026-11-12 | Fixture sizes | Synthetic tray uses nominal 200 mm (not 150/300) so demos cannot imply hard-coded width outcomes | agreed |
| R05 | 2026-11-12 | Deferred modules | Structural/support-span returns `NOT_CHECKED` (AC16); PDF/placement/bend/render stubs present but empty | agreed |
