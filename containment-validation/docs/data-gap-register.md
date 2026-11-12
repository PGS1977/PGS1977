# Data-gap register

Authority: brief §10 and §3. **No supplier dimensions, radius factors, support ratings or product references may be invented.** Update this register when owner files arrive; record actual filenames and coverage then.

Status key: `missing` | `partial` | `received-unstructured` | `verified-in-repo` | `open-assumption`.

## Manufacturer product data

| ID | Item | Manufacturer | Needed for | Status | Notes / owner action |
|---|---|---|---|---|---|
| DG01 | Containment catalogue (tray/ladder families, codes) | Legrand family (Cablofil, Swifts) | Product import, M1 examples | received-unstructured | Raw PDFs in `containment-validation/data/raw/` (see receipt log). Not structured; not verified. |
| DG02 | Usable internal envelope (not nominal W×D) | Legrand family | Area/spare (A_net), placement | missing | May be present inside raw PDFs but not extracted. Missing envelope → area validation `INCOMPLETE`. |
| DG03 | Connection ports / fitting geometry (incl. horizontal 90°) | Legrand family | Continuous path, bend PoC | missing | Not extracted from raw PDFs. Fixtures only until structured. |
| DG04 | Containment / accessory mass (kg) | Legrand family | Combined installed weight | missing | Not extracted. Missing mass → known subtotal + incomplete total; never coerce to 0. |
| DG05 | Optional rating metadata | Legrand family | Later structural module | missing | Not used for M1 pass/fail. |
| DG06 | Cable OD, kg/m (or kg/km), type codes | BICC + Cleveland Cable (raw); Prysmian still named in brief | Area, placement, weight | received-unstructured | **BICC:** `Power-Cable-EN-Catalogue_June25_digital.pdf` — **LV only; never Overhead Line.** **Cleveland:** 12 LV datasheet PDFs under `data/raw/` (6181B, 624-B, 6491B, 6941AB, BS6724, BS7846 F2/F120, …). OD/kg/m not yet structured from either source. **CDV-10:** design-basis multi-manufacturer selection (BICC / Cleveland / fixtures / future) filters product sources & cable schedule — no single-supplier hard-code; incomplete catalogues stay incomplete. |
| DG07 | Bend radius + convention (centreline vs inner surface; fixed vs pulling) | BICC + Cleveland Cable (raw) | Bend checks | received-unstructured | Bend data not extracted from BICC or Cleveland raw PDFs. BICC **LV-only** rule applies. Do not invent multipliers; missing structured fields → radius check `INCOMPLETE`. |
| DG08 | 150 mm / 300 mm tray verified geometry matching independent benchmarks | Legrand family (+ assembly notes) | AC13 | missing | Raw catalogues received; verified geometry + independent benchmarks not established. Width alone never fixes outcome. |
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
- **Raw PDFs must not be treated as verified product data.** No numeric catalogue values may be invented or copied into verified records without an explicit structuring review.

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
| AS08 | BICC catalogue scope | **LV / building-wire only** from `Power-Cable-EN-Catalogue_June25_digital.pdf`; Overhead Conductors (AAC/AAAC/ACSR/ABC) excluded | Cable verified import | Confirmed by owner 2026-11-12 — treat as agreed constraint |

## Receipt log

| Date | Files / references received | Coverage noted | Linked DG IDs | Recorded by |
|---|---|---|---|---|
| 2026-11-12 | `containment-validation/data/raw/Cablofil Fasclic+ 2023 WEB rev_11.5.23.pdf` (relocated from repo root; commit lineage via `a162c63` upload) | Cablofil Fasclic+ 2023 WEB catalogue PDF (unstructured). Legrand-family brand. | DG01 (partial raw) | Agent on owner approval |
| 2026-11-12 | `containment-validation/data/raw/swifts-cable-ladder.pdf` (from `c212ff5` upload) | Swifts cable ladder PDF (unstructured). Legrand-family brand. | DG01 (partial raw) | Agent on owner approval |
| 2026-11-12 | `containment-validation/data/raw/swifts-cable-tray-technical-guide.pdf` (from `a162c63` upload) | Swifts cable tray technical guide PDF (unstructured). Legrand-family brand. | DG01 (partial raw); DG02–DG05/DG08 still unextracted | Agent on owner approval |
| 2026-11-12 | `containment-validation/data/raw/Power-Cable-EN-Catalogue_June25_digital.pdf` (from `main` @ `644a103`; relocated via `git mv`) | BICC Power Cables Catalogue 2025 (~5.5 MB, 106 pages). Mixed LV + Overhead. **LV only may be extracted later; OH DO NOT USE.** | DG06, DG07 (raw; not verified) | Agent on owner approval (CDV-8) |
| 2026-11-12 | 12 Cleveland Cable LV datasheet PDFs under `containment-validation/data/raw/` (from `main` @ `9b2d1d3`; `git mv`) | clevelandcable.com branded LV/building & mains datasheets (6181B, 624-B, 6491B, 6941AB, BS6724, BS7846 F2/F120). Includes duplicate twin-and-earth filename pair. No OH files. | DG06, DG07 (raw; not verified) | Agent on owner approval (CDV-9) |

When further files arrive: append row here, set DG status, list actual filenames, and note which product codes gained verified fields. Do not copy numeric catalogue values into this register unless they are already in verified structured records.
