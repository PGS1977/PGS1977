# Implementation plan — Milestone 1

Authority: `docs/Cursor_AI_Development_Brief_v1.md`. Requirement and acceptance IDs retained. No application repository yet; this plan is planning-only until a repo is created.

## Objective

Local browser engineering proof of concept: project record, fixture/product import inspection, straight runs + horizontal 90° bend, cable selection, deterministic automatic placement, linked plan / cross-section / 3D, validation, weight schedule, save/reopen. Missing manufacturer files must not block scaffolding or fixture-based engine work.

## Proposed stack (from brief §8)

| Layer | Recommendation | Notes |
|---|---|---|
| App shell | TypeScript, React, Vite | Local PoC |
| Domain | Runtime-validated versioned schemas, typed units | Independent of React |
| Engine | Pure area, path, placement, collision, bend, weight | Worker for heavy placement |
| Render | 2D drawing layer + 3D adapter | Engineered geometry, not AI pictures |
| Persistence | Local browser storage + JSON import/export | Storage interface for later backend |
| Data dirs | `data/raw`, `data/verified`, `data/fixtures` | Fixture ≠ verified |

Technology choices are **recommendations**, not owner-locked constraints (`docs/decisions.md`).

## Sequence

### Increment A — Schemas, units, statuses

- Entities from brief §5: Project, Product source, Containment/Cable product, Section/Fitting, Cable instance, Validation result (Drawing/Level deferred stubs OK).
- Units: mm, mm², m, kg; kg/km → kg/m at boundary; reject ambiguous units (§4.1).
- Result states: `PASS` | `ERROR` | `INCOMPLETE` | `STALE` | `NOT_CHECKED` (§4.6).
- Provenance: `fixture` | `assumed` | `verified` on product sources.
- Naming attributes (not keys): section `LEVEL-SERVICE-TYPE-NUMBER`, fitting `…-FT-…` (§6).
- **IDs:** data-model contracts; AC09 (incomplete when mass/envelope/radius missing), AC11 (stable IDs on round-trip — persistence later).

### Increment B — Area, spare capacity, weight (pure functions)

- `A_cable = π × D² / 4`; sum physical instances including parallels (§4.2).
- `A_net = A_internal_envelope − A_union_of_obstructions`; spare % vs editable target (default 25%).
- Obstruction union once; local cleat/tie checks; missing fixing → incomplete (§4.2).
- Weight: `cable_kg = kg/m × length_m`; combined = cables + containment + accessories; missing mass ≠ 0 (§4.5).
- **AC:** AC01, AC02, AC03, AC07, AC08, AC09, AC15 (area/local spare portion), AC16 (structural panel deferred / weight available).

### Increment C — Placement and bend engine

- Centre paths independent of meshes; OD swept for clash; continuity across fitting ports (§4.3).
- Arrangements: touching, spaced (1D / 2D / custom multiplier + clear gap mm), stacked (explicit layer count + vertical gap).
- Unequal-diameter spacing: provisional `max(D1,D2)` clear-gap reference — **assumption**, owner review (`docs/data-gap-register.md`).
- Reproducible placement; arrangement result + evidence; `ERROR_NO_VALID_ARRANGEMENT_FOUND` at search limit (AC14).
- Bend: `R_achieved >= R_required`; UI “Minimum bend radius not met”; convention conversion when required (§4.4); AC05, AC06.
- Area pass + spacing fail → fit error, no overall pass (AC04).
- **AC:** AC04, AC05, AC06, AC08, AC14, AC15 (fit).

### Increment D — Linked plan / cross-section / 3D + validation workspace

- Synchronised selection across plan, cross-section, interactive 3D, issue list, weight schedule (§7 item 5).
- Straight runs + one horizontal 90° bend only in M1.
- Colour + text/symbols; validation envelope separate from simplified render mesh.
- Stale marking on input/product/rule change (AC10).
- 150/300 mm tray examples **only** with verified geometry; never hard-code outcomes (AC13 deferred until verified benchmarks exist).

### Increment E — Save / reopen and fixture packaging

- Local persistence + JSON project export/import; identical IDs, inputs, placements, numerics (AC11).
- Conspicuous synthetic fixtures under `data/fixtures/`; incomplete production-data state until verified records arrive.
- Design-basis screen: units, spare %, arrangement/spacing, product sources, assumptions (§7 item 2 — M1 subset).
- Dashboard create/open projects (§7 item 1 — M1 subset).

## Reviewable increments (PR-sized)

1. Schemas + units + status enums + provenance
2. Spare-area arithmetic + obstruction union tests (AC01–AC03)
3. Weight functions + incomplete mass (AC07–AC09)
4. Placement path/spacing + search-limit error (AC04, AC14)
5. Bend-radius checks (AC05–AC06)
6. Linked views + issue/weight UI shell
7. Save/reopen + fixture pack + incomplete catalogue banner

## Deferred (explicit)

| Item | Milestone / note |
|---|---|
| PDF upload, scale detect/calibrate, route sketch, cable CSV map, equipment endpoints | M2 (AC12 primarily M2) |
| Tees, reducers, rises/drops, multi-level, compartments, branded reports/revisions | M3 |
| AI companion, auth, org isolation, subscriptions, collaboration | M4 |
| Support spans / structural adequacy | Separate module; AC16 = `NOT_CHECKED` |
| Billing in calculation path | Never |
| Verified Legrand/Prysmian catalogue | Owner supply; track in data-gap register |
| AC13 manufacturer bend assemblies | After verified geometry + independent benchmarks |

## Acceptance mapping (M1 focus)

| AC | M1 intent |
|---|---|
| AC01–AC03 | Engine tests with synthetic areas |
| AC04–AC06, AC14 | Placement/bend engine |
| AC07–AC09 | Weight + incomplete data |
| AC08 | Multi-instance throughout |
| AC10 | Stale after change (UI + model) |
| AC11 | Save/reopen |
| AC12 | Out of M1 UI; keep model hooks for scale/crossing incomplete |
| AC13 | Blocked on verified data |
| AC15 | Local obstruction governing result |
| AC16 | Deferred panel; weights shown |

## Non-goals for this planning turn

No application code scaffolding; no invented manufacturer dimensions.
