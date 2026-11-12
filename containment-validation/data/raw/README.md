# Raw manufacturer sources

Owner-supplied files retained **unchanged**. Do not edit bytes in this directory.

## Cable sources (BICC)

| Filename | Brand | Notes |
|---|---|---|
| `Power-Cable-EN-Catalogue_June25_digital.pdf` | BICC Cables | Power Cables Catalogue 2025 (unstructured). **MIXED CONTENT:** includes Low Voltage / building-wire sections **and** Overhead Conductors (AAC, AAAC, ACSR, ABC). |

### HARD RULE — LV only

**Do NOT use Overhead Line cables.** When structuring this PDF later, extract **LV only** (building wires / LV power). Overhead Conductors / aerial bundle sections are **out of scope** and must not enter `data/verified/` or calculations.

Status: **raw received** (`received-unstructured`). Not verified product data.

## Containment sources

Cablofil / Swifts PDFs are relocated on a separate intake PR (`cursor/raw-catalogue-intake-b66e`). They may not yet be present on `main` until that PR merges.
