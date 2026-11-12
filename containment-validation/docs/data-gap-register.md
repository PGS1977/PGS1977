# Data-gap register

Authority: brief §10 and §3. **No supplier dimensions, radius factors, support ratings or product references may be invented.** Update this register when owner files arrive; record actual filenames and coverage then.

Status key: `missing` | `partial` | `received-unstructured` | `verified-in-repo` | `open-assumption`.

## Manufacturer product data

| ID | Item | Manufacturer | Needed for | Status | Notes / owner action |
|---|---|---|---|---|---|
| DG01 | Containment catalogue (tray/ladder families, codes) | Legrand | Product import, M1 examples | missing | Owner will supply files to repository. Record filenames/coverage on receipt. |
| DG02 | Usable internal envelope (not nominal W×D) | Legrand | Area/spare (A_net), placement | missing | Required per product; missing envelope → area validation `INCOMPLETE`. |
| DG03 | Connection ports / fitting geometry (incl. horizontal 90°) | Legrand | Continuous path, bend PoC | missing | M1 needs at least straight + horizontal 90° geometry when verified; until then fixtures only. |
| DG04 | Containment / accessory mass (kg) | Legrand | Combined installed weight | missing | Missing mass → known subtotal + incomplete total; never coerce to 0. |
| DG05 | Optional rating metadata | Legrand | Later structural module | missing | Not used for M1 pass/fail. |
| DG06 | Cable OD, kg/m (or kg/km), type codes | Prysmian | Area, placement, weight | missing | Initial cable manufacturer. Structured DB is not implied by attaching a PDF catalogue. |
| DG07 | Bend radius + convention (centreline vs inner surface; fixed vs pulling) | Prysmian | Bend checks | missing | Do not invent multipliers; missing → radius check `INCOMPLETE`. |
| DG08 | 150 mm / 300 mm tray verified geometry matching independent benchmarks | Legrand (+ assembly notes) | AC13 | missing | Examples enabled only after verified records; width alone never fixes outcome. |
| DG09 | Cleat / steel-tie / fixing intrusion geometry & mass | TBD / owner | Local spare & fit (AC15) | missing | Engineer-entered allowances need source, location, dimensions, `assumed` status. |
| DG10 | Support-span / structural load data | — | Deferred module | missing | Explicitly out of M1; UI `NOT_CHECKED` (AC16). |

## Data class rules (fixture vs verified vs assumed)

| Class | Meaning | Allowed in calc | UI / report presentation |
|---|---|---|---|
| **fixture** | Synthetic development records under `data/fixtures/` | Yes, for scaffolding & tests | Must be conspicuously labelled; **never** manufacturer-verified |
| **assumed** | Engineer- or project-entered values with documented provenance | Yes, with incomplete/assumption flags where rules require | Show assumed-data status; retain source/location/dims |
| **verified** | Reviewed structured records from owner-supplied sources (`data/verified/`) | Yes | May claim manufacturer-backed checks for covered fields only |
| **raw** | Owner files unchanged in `data/raw/` | Not used directly until structured & verified | Retain revision/date/reference on Product source |

Rules:

- Incomplete production-data state until verified records exist; do not block fixture-based engine work.
- Import must not silently mutate issued snapshots when catalogues revise.
- Automatic product substitution / tray upsize requires explicit engineer action (suggestions may show effects only).

## Open assumptions (owner review)

| ID | Assumption | Current provisional rule | Impact | Owner decision needed |
|---|---|---|---|---|
| AS01 | Unequal-diameter spaced arrangement | Clear surface-to-surface gap; spacing reference = `max(D1, D2)` | Placement gaps & fit errors | Confirm or replace convention |
| AS02 | Stacked arrangement defaults | Layer count and vertical gap are **explicit project inputs**; no silent defaults that invent envelope height | Stacked placement; missing layer/envelope → `INCOMPLETE` | Confirm required inputs / any preferred defaults |
| AS03 | Open tray/ladder cable envelope height | Must come from product/project data; no unlimited stacking above sides | Area & placement | Supply per-product envelope definition |
| AS04 | Spaced gap vs area spare | Spacing gaps remain unoccupied in area metric but are enforced by placement; area spare alone ≠ room for every future arrangement | Engineer messaging | Confirm wording / UX expectation |
| AS05 | Search-limit exhaustion | Return fit error / `ERROR_NO_VALID_ARRANGEMENT_FOUND`; do not claim mathematical impossibility | AC14 | Confirm acceptable search limits once engine exists |
| AS06 | 25% spare default | Editable default including custom %; target in `[0, 100)` | Design basis | Confirm default remains 25% |
| AS07 | Fixture geometry for M1 bend PoC | Synthetic straight + 90° bend fixtures until DG03/DG08 filled | PoC demos | Approve fixture set labelling; no production claims |

## Receipt log

| Date | Files / references received | Coverage noted | Linked DG IDs | Recorded by |
|---|---|---|---|---|
| — | *None yet* | — | — | — |

When files arrive: append row here, set DG status, list actual filenames, and note which product codes gained verified fields. Do not copy numeric catalogue values into this register unless they are already in verified structured records.
