# Acceptance checklist (AC01–AC16)

Source: brief §9. Working checklist for Milestone 1. Status values: `not started` | `in progress` | `pass` | `fail` | `blocked` | `deferred`.

M1 applicability: `core` (must exercise in M1), `partial` (model/hooks only or blocked on data), `out` (later milestone; keep visible).

| ID | Check | Required result | M1 applicability | Status | Evidence / notes |
|---|---|---|---|---|---|
| AC01 | Net area 10000 mm², cables 7500 mm², target 25% | Exactly 25% spare; passes area check | core | pass | `tests/area.ac.test.ts` — synthetic areas only |
| AC02 | Envelope 10000 mm², obstruction union 1000 mm², cables 7000 mm² | Net 9000 mm²; spare 22.222…%; fails 25% target | core | pass | Unrounded comparison in `evaluateSpareArea` |
| AC03 | Two identical overlapping obstruction records | Deduct geometric union once | core | pass | `unionAreaMm2` AABB sweep; also partial-overlap case |
| AC04 | Area target passes but specified spacing cannot be achieved | Fit error; no overall pass | core | pass | `tests/placement.ac.test.ts` — OVERALL_FIT_ERROR |
| AC05 | Required radius 300 mm; achieved 299 mm | Bend error; no display-rounding pass | core | pass | `tests/bend.ac.test.ts` — “Minimum bend radius not met” |
| AC06 | Required and achieved both 300 mm, same convention | Radius check passes; other checks separate | core | pass | `tests/bend.ac.test.ts` |
| AC07 | Cable 2 kg/m, path 5 m; containment/accessories 3 kg | Cable 10 kg; combined 13 kg | core | pass | `tests/weight.ac.test.ts` |
| AC08 | Second cable instance added | Area, arrangement and mass account for both | core | pass | Area + weight + arrangement placement covered |
| AC09 | Manufacturer radius, weight or usable envelope missing | Relevant result `INCOMPLETE`; missing weight ≠ 0 | core | pass | Envelope + mass + bend-radius incomplete paths |
| AC10 | Product/route/scale changes after validation | Affected results `STALE` until recalculated | core | pass | `tests/stale.ac10.test.ts` + workspace spare/rule change demo |
| AC11 | Save/reopen and export | Identical IDs, inputs, placements, numeric results | core | not started | Local JSON PoC |
| AC12 | Recognised scale unconfirmed; PDF crossing ambiguous | Dimensional validation incomplete; no inferred junction | out / partial | deferred | M2 PDF workflow; DrawingStub has `scaleConfirmed` |
| AC13 | Verified four-cable 150/300 mm bend assemblies | Match independent results; width alone never fixes outcome | partial | blocked | Needs verified Legrand/Prysmian geometry (DG08) |
| AC14 | Search limit reached | Fit error: no valid arrangement within search; no proven-impossibility claim | core | pass | `tests/placement.ac.test.ts` — ERROR_NO_VALID_ARRANGEMENT_FOUND |
| AC15 | Local cleat restriction in otherwise clear section | Governing local fit/spare restriction reported | core | pass | `evaluateLocalRestrictions` + placement obstacle clash |
| AC16 | Structural/support-span panel | Shows deferred / `NOT_CHECKED`; weight remains available | core | pass | `tests/deferred.ac16.test.ts` |

## Follow-on cases (brief §9 — add when features land)

- Unit-conversion boundary cases
- Split/merge ownership (no double-count at junctions)
- Continuous path identity across fittings
- Report consistency (immutable issued revision)

Track those under new AC IDs when specified; do not invent manufacturer benchmarks here.
