# Containment Validation

Local browser engineering proof of concept (Milestone 1). Brand line: *Developed By Designers For Designers*.

Authority: [`docs/Cursor_AI_Development_Brief_v1.md`](./docs/Cursor_AI_Development_Brief_v1.md).

## Structure (brief §8)

| Path | Role |
|---|---|
| `src/domain/` | Entities, units, schemas, statuses, provenance |
| `src/engine/` | Pure area, obstruction union, weight (placement/bend next) |
| `src/import/` | Import adapters (stub) |
| `src/ui/` | Screens (minimal shell — no simulated results) |
| `src/render/` | 2D/3D adapters (stub) |
| `src/storage/` | Persistence interface |
| `src/reports/` | Export adapters (stub) |
| `data/raw/` | Owner sources unchanged |
| `data/verified/` | Reviewed structured records (empty) |
| `data/fixtures/` | **Synthetic** development records |
| `tests/` | AC numeric benchmarks |
| `docs/` | Brief, plans, decisions, gaps |

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Data rules

- Fixtures ≠ verified. Never invent Legrand/Prysmian production values.
- Missing mass ≠ 0. Result states: `PASS | ERROR | INCOMPLETE | STALE | NOT_CHECKED`.
- Do not hard-code 150/300 mm pass/fail from nominal width.
