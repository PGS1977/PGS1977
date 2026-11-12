# Raw manufacturer sources

Owner-supplied files retained **unchanged**. Do not edit bytes in this directory. Structure into `../verified/` only after review.

## Containment sources (Cablofil / Swifts)

| Filename | Brand / family | Notes |
|---|---|---|
| `Cablofil Fasclic+ 2023 WEB rev_11.5.23.pdf` | Cablofil (Legrand family) | Unstructured PDF catalogue — **not** verified structured product data |
| `swifts-cable-ladder.pdf` | Swifts (Legrand family) | Unstructured PDF — ladder |
| `swifts-cable-tray-technical-guide.pdf` | Swifts (Legrand family) | Unstructured PDF — tray technical guide |

## Cable sources (BICC)

| Filename | Brand | Notes |
|---|---|---|
| `Power-Cable-EN-Catalogue_June25_digital.pdf` | BICC Cables | Power Cables Catalogue 2025 (unstructured). **MIXED CONTENT:** includes Low Voltage / building-wire sections **and** Overhead Conductors (AAC, AAAC, ACSR, ABC). |

### HARD RULE — LV only

**Do NOT use Overhead Line cables.** When structuring the BICC PDF later, extract **LV only** (building wires / LV power). Overhead Conductors / aerial bundle sections are **out of scope** and must not enter `data/verified/` or calculations. See `DO-NOT-USE-OVERHEAD-LINE.md`.

Status: **raw received** (`received-unstructured`). Not usable for manufacturer-backed calculation claims until structured and moved to `verified/`.
