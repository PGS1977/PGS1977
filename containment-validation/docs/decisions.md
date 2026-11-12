# Decision log

Seeded from `docs/Cursor_AI_Development_Brief_v1.md` (v1.0). Append new rows; do not silently rewrite history. Status: `agreed` | `proposed` | `open`.

| ID | Date | Topic | Decision | Status | Notes |
|---|---|---|---|---|---|
| D01 | 2026-11-12 | Drawing input | PDF is the drawing input format (upload layout or engineer-drawn routes over PDF plan); confirmed routes become selectable containment components, not thick lines | agreed | Full PDF UX in M2; requirement retained for complete workflow |
| D02 | 2026-11-12 | Scale | Attempt automatic scale recognition; show for confirmation; allow manual input and known-dimension calibration; store scale per page/viewport | agreed | Unconfirmed scale → dimensional validation incomplete (AC12) |
| D03 | 2026-11-12 | Product data ownership | Owner supplies Legrand containment files; Prysmian is initial cable manufacturer; attaching a catalogue ≠ structured DB | agreed | Track gaps in `data-gap-register.md`; never invent dimensions |
| D04 | 2026-11-12 | Data provenance | Distinguish fixture / assumed / verified; fixtures never presented as genuine manufacturer data | agreed | Incomplete production-data state until verified records exist |
| D05 | 2026-11-12 | Naming scheme | Sections `LEVEL-SERVICE-TYPE-NUMBER`; fittings `LEVEL-SERVICE-TYPE-FT-NUMBER`; no building number | agreed | e.g. `L01-SM-TR-001`, `L01-SM-TR-FT-001`; human refs editable, not DB keys |
| D06 | 2026-11-12 | Spare capacity | Selectable spare % including custom; 25% initial editable default; spare from free usable CSA after ODs and obstructions; ties/cleats ≠ spare | agreed | AC01–AC03, AC15 |
| D07 | 2026-11-12 | Spacing options | Spaced: 1 diameter, 2 diameters, or custom multiplier; show clear gap in mm | agreed | Touching / spaced / stacked arrangements |
| D08 | 2026-11-12 | Unequal-diameter spacing | Provisional: clear surface-to-surface gap; reference `max(D1,D2)` | proposed | **Owner review** — AS01 in data-gap register |
| D09 | 2026-11-12 | Result states | `PASS`, `ERROR`, `INCOMPLETE`, `STALE`, `NOT_CHECKED` | agreed | Green only when mandatory implemented checks pass on complete accepted inputs |
| D10 | 2026-11-12 | Error triggers | Error if cables do not fit, spare target unmet, or bend tighter than permitted minimum | agreed | UI: “Minimum bend radius not met” |
| D11 | 2026-11-12 | Weight vs structure | Calculate and show weights now; recommended support spans / structural loading later; no structural pass in initial release | agreed | AC16 = deferred / `NOT_CHECKED` |
| D12 | 2026-11-12 | AI companion | Prompt-assisted actions in later stage; calculations must work without it | agreed | M4 |
| D13 | 2026-11-12 | Commercial outputs | Complete workflow: company-branded PDF/Excel/Word, revision history, eventual single/multi-user subscriptions | agreed | Reports M3; subscriptions M4; not M1 |
| D14 | 2026-11-12 | Units | Internal mm, mm², m, kg; typed conversions at boundaries; metric/imperial display prefs; kg/km÷1000→kg/m; reject ambiguous units | agreed | §4.1 |
| D15 | 2026-11-12 | Usable envelope | Nominal W/D not automatically usable internal; store verified usable boundaries; open tray envelope height explicit | agreed | Missing envelope → incomplete area validation |
| D16 | 2026-11-12 | Tech stack | Proposed: TypeScript + React + Vite; dedicated geometry/calc package; 2D layer; 3D adapter; versioned import; worker for placement; local persistence + JSON export; storage interface for later backend | proposed | Brief §8 — recommendations, **not** owner-confirmed constraints; document final dependency picks when repo starts |
| D17 | 2026-11-12 | Engine isolation | Geometry/calculations independent of React, PDF pixels, renderer state and any LLM; no secrets in frontend | proposed | Aligns with D16 |
| D18 | 2026-11-12 | M1 tray examples | 150 mm and 300 mm tray examples only when matching verified product geometry supplied; never hard-code pass/fail from nominal width | agreed | AC13 blocked until DG08 |
| D19 | 2026-11-12 | Brief precedence | This brief consolidates Workflow Draft 0.6 + owner decisions; brief wins on conflict | agreed | Implementation defaults are proposals to start development |
| D20 | 2026-11-12 | Out of scope (electrical) | Existing cable electrical sizing outside app; arrangement labels alone ≠ BS 7671 / segregation compliance | agreed | Separate specs before those modules |

## Open items for owner

1. Confirm or replace AS01 unequal-diameter spacing (`max(D1,D2)`).
2. Confirm stacking required inputs / any defaults (AS02).
3. Supply Legrand + Prysmian source files; populate receipt log.
4. When repo starts: confirm or revise proposed TypeScript/React/Vite stack (D16).

## Scaffolding decisions (Increment A + B)

See also `repo-decisions.md`.

| ID | Date | Topic | Decision | Status | Notes |
|---|---|---|---|---|---|
| D21 | 2026-11-12 | App path | Application under `containment-validation/` subfolder | agreed | Preserves root profile README |
| D22 | 2026-11-12 | Runtime validation | Zod schemas for domain records | agreed | Implements D16 domain recommendation |
| D23 | 2026-11-12 | Test runner | Vitest for AC01–AC03, AC07–AC09, AC16 | agreed | |
