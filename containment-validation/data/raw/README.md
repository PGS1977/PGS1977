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
| `Power-Cable-EN-Catalogue_June25_digital.pdf` | BICC Cables | Power Cables Catalogue 2025 (unstructured). **MIXED CONTENT:** LV / building-wire **and** Overhead Conductors (AAC, AAAC, ACSR, ABC). |

### HARD RULE — BICC LV only

**Do NOT use Overhead Line cables.** Extract **LV only** from the BICC PDF. See `DO-NOT-USE-OVERHEAD-LINE.md`.

## Cable sources (Cleveland Cable)

Owner upload `main` @ `9b2d1d3` (“Add files via upload”). Datasheets branded clevelandcable.com. LV / building & mains types — no Overhead Line files in this set.

| Filename | Notes |
|---|---|
| `6181B-insulated-cable-xlpe-lszh-up-to-35mm.pdf` | 6181B surface wiring BS7211 LSZH |
| `6181b-mains-cable-xlpe-lszh-50mm-1000mm.pdf` | 6181B mains BS8573 XLPE LSZH |
| `624-b-twin-and-earth-cable-lszh-1mm-16mm.pdf` | 624-B twin & earth BS7211 |
| `624-b-twin-and-earth-cable-lszh-1mm-16mm (1).pdf` | Duplicate upload of twin & earth (different blob hash; retain both raw) |
| `6491B-H07ZR-lszh-insulated-cable-up-to-630mm.pdf` | 6491B H07Z-R |
| `6941ab-power-cable-xlpe-awa-lszh-50mm-1000mm.pdf` | 6941AB power BS6724 AWA |
| `bs6724-1kv-mains-cable-xlpe-swa-lszh-up-to-16mm.pdf` | BS6724 SWA up to 16 mm² |
| `bs6724-1kv-mains-cable-xlpe-swa-lszh-25mm-400mm.pdf` | BS6724 SWA 25–400 mm² |
| `bs7846-bs6387-f2-fire-resistant-mains-cable-up-to-16mm.pdf` | F2 fire resistant |
| `bs7846-bs6387-f2-fire-resistant-mains-cable-25mm-400mm.pdf` | F2 fire resistant 25–400 |
| `bs7846-bs8491-f120-enhanced-fire-resistant-mains-cable-4mm-16mm.pdf` | F120 enhanced |
| `bs7846-bs8491-f120-enhanced-fire-resistant-mains-cable-25mm-400mm.pdf` | F120 enhanced 25–400 |

Status: **raw received** (`received-unstructured`). Not verified product data. No OD/kg/m/bend values invented from these PDFs.
