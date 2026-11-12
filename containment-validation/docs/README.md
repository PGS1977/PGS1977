# Containment Validation — repository docs

Authority: [`Cursor_AI_Development_Brief_v1.md`](./Cursor_AI_Development_Brief_v1.md).

## Repository placement

The GitHub repository root (`PGS1977/PGS1977`) already contained a profile `README.md` (`# PGS1977`). To preserve that work, the application lives in the **`containment-validation/`** subfolder rather than replacing the repository root.

## Docs in this folder

| File | Role |
|---|---|
| `Cursor_AI_Development_Brief_v1.md` | Authoritative brief (copied) |
| `implementation-plan.md` | Milestone 1 increments |
| `acceptance-checklist.md` | AC01–AC16 working checklist |
| `data-gap-register.md` | Missing manufacturer data + assumptions |
| `decisions.md` | Decision log |
| `project-context.md` | Coordination summary |
| `repo-decisions.md` | Decisions made when scaffolding this repo |

## Fixtures vs verified

| Class | Path | Use |
|---|---|---|
| **fixture** | `data/fixtures/` | Synthetic development only; conspicuously labelled; never manufacturer-verified |
| **verified** | `data/verified/` | Reviewed structured records from owner-supplied sources (empty until supplied) |
| **raw** | `data/raw/` | Owner files retained unchanged |
| **assumed** | project-entered | Allowed with provenance; may mark results incomplete |

Missing mass ≠ 0. Missing usable envelope → area check `INCOMPLETE`. No hard-coded 150/300 mm pass/fail.
