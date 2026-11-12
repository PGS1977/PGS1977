# Product data directories

| Directory | Purpose | Provenance |
|---|---|---|
| `raw/` | Owner-supplied source files retained **unchanged** | Not used in calculations until structured & verified |
| `verified/` | Reviewed structured product records from owner sources | `verified` — may back manufacturer claims for covered fields only |
| `fixtures/` | Conspicuously synthetic development records | `fixture` — **never** manufacturer-verified |

## Rules

- Incomplete production-data state until verified records exist; fixture-based engine work continues.
- Do **not** invent Legrand / Prysmian dimensions, radius factors, support ratings or product references.
- Nominal tray width/depth is not usable envelope. Store verified usable boundaries per product.
- 150 mm / 300 mm tray examples are enabled only when matching verified geometry is supplied; width alone never fixes pass/fail.
- Missing mass is unknown, not zero.

See `docs/data-gap-register.md` (project store / copied docs) for DG01–DG10 status.
