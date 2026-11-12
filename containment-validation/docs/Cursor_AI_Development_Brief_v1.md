# Containment Validation App Development Brief

Version 1.0 • 12 November 2026 • Owner: Gavin Power

Brand line: Developed By Designers For Designers

## 1 Purpose and authority

Build an engineering application that checks whether previously sized cables can be accommodated along selected containment, including changes of direction. The 2D drawing, 3D model, cable schedule, area calculations and weights must share the same project data. The engineer must be able to see the limiting cable, fitting or section and understand each result.

This brief consolidates Workflow Draft 0.6 and the owner's subsequent decisions. Where they conflict, this brief takes precedence for development. Implementation defaults below are proposals to allow development to start; do not represent them as manufacturer requirements or BS 7671 rules.

The initial objective is a working local proof of concept, followed by the complete workflow. Subscription billing, structural support recommendations and full manufacturer coverage are later stages. Do not treat a proof of concept as a production-ready subscription service.

## 2 Agreed requirements

- PDF is the drawing input format. Support an uploaded containment layout or engineer-drawn routes over a PDF building plan. Convert confirmed routes into selectable containment components, not merely thick lines.
- Attempt automatic scale recognition. Display the detected scale for engineer confirmation and allow manual input and known-dimension calibration. Store scale per page/viewport.
- Legrand containment information will be supplied to the repository by the owner. Prysmian is the initial cable manufacturer. Do not assume that attaching a catalogue gives the app a structured database.
- Automatically arrange cables within the selected containment and route them continuously through fittings, subject to the selected touching, spaced or stacked arrangement.
- Allow selectable spare-capacity percentages, including a custom value; 25% is the initial editable default.
- Calculate spare capacity from free usable cross-sectional area after accounting for actual cable outside diameters and physical obstructions. Steel ties/tywraps and cleats must not count as spare space.
- Provide spaced arrangements of 1 cable diameter, 2 diameters and a custom multiplier, displaying the resulting clear gap in millimetres.
- Flag an error if cables do not fit, the selected spare target is not met, or any cable bends tighter than its permitted minimum radius.
- Calculate cable weight and combined installed weight for every containment section and fitting.
- Recommended support spans and structural loading assessment will be developed later. Continue to report weights now, but do not issue a structural pass in the initial release.
- Use section references without a building number: LEVEL-SERVICE-TYPE-NUMBER. Example L01-SM-TR-001. Fittings use L01-SM-TR-FT-001.
- Include an AI companion for prompt-assisted actions in a later implementation stage. Calculations must work without it.
- The complete workflow must support company-branded PDF, Excel and Word outputs, revision history and eventual single/multiple-user subscriptions.

## 3 Initial scope and development sequence

### Milestone 1 Engineering proof of concept

Build a local browser application with a project record, product-data import/inspection, selected straight runs and a horizontal 90-degree bend, cable selection, automatic placement, cross-section, plan and 3D views, validation, weight schedule and save/reopen. Provide 150 mm and 300 mm tray examples only when matching verified product geometry is supplied. Neither must be programmed to pass or fail merely because of its nominal width.

Milestone 1 must run with explicitly marked synthetic fixtures for development. Fixture data must never be presented as genuine Legrand/Prysmian data or receive a manufacturer-verified status. Provide an incomplete production-data state until verified records are supplied. Missing manufacturer files must not block scaffolding and fixture-based engine development.

### Milestone 2 Drawing and schedule workflow

Add PDF upload/rendering, scale detection and manual calibration, snapped route sketching, fitting insertion, stable references, cable import/mapping, equipment endpoints and continuous route allocation. Start automatic recognition with vector PDFs; provide tracing fallback for scanned PDFs. Clearly label unsupported recognition cases. Retain the overall PDF input requirement.

### Milestone 3 Network and reporting

Add verified tees, reducers, rises/drops and multi-level routing incrementally, with shared-route cable continuity, compartments, stacked/spaced cases, branded reports and revisions. Each fitting family requires geometry and independent checks before enabling verified results.

### Milestone 4 Automation and commercial service

Add assisted recognition improvements, AI companion, authentication, organisation isolation, subscriptions, permissions and collaboration. Add recommended support spans and structural checks as a separately specified engineering module. Design the core IDs and persistence to permit these additions without embedding billing into calculations.

## 4 Engineering calculation contract

### 4.1 Units and product boundaries

Use millimetres, square millimetres, metres and kilograms internally, with explicit typed conversions at import/display boundaries. Accept metric and imperial display preferences. Cable mass may arrive in kg/km: divide by 1000 to obtain kg/m. Reject ambiguous units.

Nominal tray width/depth is not automatically usable internal width/depth. Store verified usable boundaries for each product. For open tray/ladder, the permitted cable envelope height must be explicitly defined from product/project data; do not assume unlimited stacking above the sides. A missing envelope makes area validation incomplete.

### 4.2 Area and spare capacity

For a circular cable, A_cable = pi × D_external² / 4. Sum over actual physical cable instances, including parallel cables. Conductor copper area is not the occupied cable area.

At each relevant cross-section:

A_net = A_internal_envelope − A_union_of_obstructions

Spare_percent = 100 × (A_net − sum(A_cable)) / A_net

Require Spare_percent >= selected_target. Reject A_net <= 0 and targets outside 0 <= target < 100. Use unrounded values for comparisons; rounding is for display only.

Obstructions include dividers, cleats, steel ties and other intrusions into the cable envelope. Count overlapping obstruction areas once. Do not deduct containment steel again if usable internal geometry already excludes it. Only the part of a fixing that intrudes into the usable envelope reduces that area.

Cleats/ties are local objects: check occupied sections at their actual locations. Report the governing minimum spare along each section, not an averaged obstruction allowance that hides a local restriction. Missing fixing geometry must be flagged; any engineer-entered allowance must have a source, location, dimensions and assumed-data status. Clearance/placement checks use actual obstacle geometry as well as the area calculation.

Cable spacing gaps remain unoccupied area in the area metric, but must be respected by the placement engine. Explain that area spare alone does not establish enough room for every future cable arrangement.

### 4.3 Placement and continuous paths

Represent cable centre paths independently from their display meshes. Sweep the actual outside diameter along each path for fit/clash checks. Detect cable-to-cable and cable-to-containment/obstruction interference. Maintain identity, order and continuity between adjacent components; do not rearrange cables independently at a fitting boundary.

Automatic placement must be reproducible for unchanged inputs. Proposed initial convention: spaced means clear surface-to-surface gap; for unlike cable diameters use max(D1,D2) as the spacing reference and record this assumption. Stacked layer count and vertical gap must be explicit project inputs. No arbitrary cable interpenetration or height changes to make an arrangement appear to fit.

Define an arrangement result containing placements, paths, search settings and validation evidence. The engine may return ERROR_NO_VALID_ARRANGEMENT_FOUND if its documented search limit is reached. Show a simple fit error to the engineer with an explanation; do not claim mathematical impossibility unless exhaustively established. Provide rerun/review actions. Never show green based solely on failure to find a clash in a low-resolution image.

### 4.4 Bend radius

The required condition is R_achieved >= R_required at every point along the cable path, including transitions, bend entry/exit and compound turns. In UI wording, use “Minimum bend radius not met” rather than the ambiguous “radius exceeded”. Highlight the location and display achieved and required radii.

Store the manufacturer's radius convention and applicable conditions, including fixed installation or installation/pulling where available. If the specification is for the cable inner surface, convert the centreline radius appropriately for circular cable geometry before comparison. Do not compare unlike conventions or invent absent manufacturer multipliers. Missing required data makes the check incomplete.

Use analytic line/arc geometry where supported. Define approximation error bounds for sampled curves and swept collision checks; no undocumented tolerance may turn a failing cable into a pass.

### 4.5 Weight

Cable_section_kg = manufacturer_cable_kg_per_m × actual_cable_length_in_section_m.

Total_cable_kg = sum of all physical cable instance contributions.

Combined_installed_kg = total_cable_kg + containment_kg + included_cover_divider_fixing_accessory_kg.

Use actual arc lengths through fittings and separate cable paths where their lengths differ. Assign lengths and objects to unique section/fitting owners to prevent double counting at junctions. Show individual cable kg/m, section contribution kg, total cable kg, containment/accessory kg, combined kg and average kg/m with its length basis. Expose local concentrated objects separately. A missing mass is unknown, not zero; show a known subtotal and incomplete total.

Do not apply an assumed future cable weight based on 25% spare area. Do not recommend support spans or structural adequacy in this release. Label these checks deferred/not checked.

### 4.6 Result states and stale results

Use PASS, ERROR, INCOMPLETE, STALE and NOT_CHECKED. Green means all mandatory implemented checks pass using complete accepted inputs. Red means fit, spare or radius failure. Amber means missing or unconfirmed inputs. NOT_CHECKED identifies deferred modules and must not be included in claims of overall compliance.

Every result records calculation version, input revision/hash, product data revisions, issue code, section/fitting ID, cable ID where relevant, measured/required values and units. Geometry, cable, fixing, scale, product or rule changes mark affected results stale. An issued report remains an immutable snapshot.

## 5 Data model

Implement runtime-validated, versioned records with immutable IDs. Human references are editable attributes, not database keys.

| Entity | Required information |
|---|---|
| Project | ID, project number/name, client/site, stage, designer, units, revision, rule settings |
| Drawing | ID, PDF source, revision, page/viewport, transform, confirmed scale, calibration evidence |
| Level and equipment | Level code/elevation; equipment ID/type/position and cable connection ports |
| Product source | Manufacturer, source file/reference, revision/date, provenance and verified/assumed/fixture status |
| Containment product | Code/family, type, usable envelope, connection ports, geometry, mass and optional rating metadata |
| Cable product | Code/type, outside geometry, kg/m, bend constraints and their conditions/reference convention |
| Section and fitting | ID/reference, product link, position/orientation, level, service, ports, length and arrangement settings |
| Fixing/obstruction | Product/source, geometry, position, ownership, kg, intrusion envelope and assumed-data status |
| Cable instance | ID/reference, product, source row, start/end equipment, continuous ordered route and placement |
| Validation result | Input revision, check/status, evidence, issue links, measured/required values and units |
| Issued revision | Immutable inputs/results/library versions, report selections and issue timestamp |

Import source records without mutating older project snapshots. A revised catalogue must not silently alter an issued design. Define JSON schemas and import error reports before connecting the catalogue to calculations.

## 6 Naming and network rules

Section: LEVEL-SERVICE-TYPE-NUMBER, e.g. L01-SM-TR-001.

Fitting: LEVEL-SERVICE-TYPE-FT-NUMBER, e.g. L01-SM-TR-FT-001.

Levels include L00, L01, B1, RF and VR for spanning levels, with actual start/end elevations retained. Services: MA mains, SM submains, FC final circuits, TC telecommunications, FA fire alarm, SE security, BM BMS, EL other ELV and MX shared. Types: TR tray, LD ladder, TK trunking, BK basket and CN conduit; only supported types are enabled.

Generate unique sequences within level/service/type across the project. Never reuse archived references or automatically renumber existing objects. Keep manufacturer and size separate. Sections terminate at fitting ports or defined endpoints and split at product/size/configuration changes. Fittings have their own ownership and references. A drawing crossing is not a connected node without confirmation. Track parent/child history on splits and merges.

## 7 Screens and interaction

1. Dashboard: create/open projects; show project number, site, stage, revision and status.
2. Design basis: units, spare percentage, arrangement/spacing, compartments, product sources and assumptions.
3. Drawing workspace: PDF, scale confirmation/calibration, sketch/recognition tools, snapped routes and component selections.
4. Cable schedule: CSV/XLSX field mapping, product matching, quantities, missing data and equipment endpoints.
5. Validation workspace: synchronised plan, interactive 3D, cross-section, issue list and weight schedule. Select any section/cable/reference to highlight it in every view.
6. Reports: branded layout, selected views, results, assumptions, source revisions, deferred checks and open issues. Preserve cable and section identities in PDF/Word/Excel exports.

Use engineered 3D geometry, not AI-generated pictures, to establish dimensions and results. Colour must be accompanied by text and symbols. A product model can be simplified for rendering, but its validation envelope must remain accurate and separately identifiable.

## 8 Proposed technical architecture

These are implementation recommendations, not owner-confirmed technology constraints. For a new repository, start with TypeScript, React and Vite; use a dedicated geometry/calculation package, a 2D drawing layer, a 3D rendering adapter and versioned product/project import modules. Select maintained PDF, rendering and export dependencies after checking current official documentation and compatible licences. Document the selection.

Keep geometry and calculations independent of React, PDF pixels, renderer state and any LLM. Run computationally heavy placement in a worker with progress and cancellation. Use local browser persistence and JSON project export/import for the proof of concept; define a storage interface for a later authenticated backend. Do not place secrets in frontend code.

Suggested repository structure:

- docs/: this brief, decisions, data contracts and benchmark evidence.
- src/domain/: entities, units, schemas and statuses.
- src/engine/: area, geometry, path, placement, collision, bend and weight calculations.
- src/import/: product, cable schedule and PDF adapters.
- src/ui/: screens, drawing tools and linked selection.
- src/render/: 2D/3D geometry adapters.
- src/storage/: project and revision persistence.
- src/reports/: export adapters.
- data/raw/: owner-supplied source files, retained unchanged.
- data/verified/: reviewed structured product records.
- data/fixtures/: conspicuously synthetic development records.
- tests/: independent numeric benchmarks and end-to-end workflows.

## 9 Acceptance cases

| ID | Check | Required result |
|---|---|---|
| AC01 | Net area 10000 mm², cables 7500 mm², target 25% | Exactly 25% spare; passes area check |
| AC02 | Envelope 10000 mm², obstruction union 1000 mm², cables 7000 mm² | Net area 9000 mm²; spare 22.222…%; fails 25% target |
| AC03 | Two identical overlapping obstruction records covering the same area | Deduct their geometric union once |
| AC04 | Area target passes but specified spacing cannot be achieved | Fit error; no overall pass |
| AC05 | Required radius 300 mm; achieved 299 mm | Bend error; no display-rounding pass |
| AC06 | Required and achieved radii both 300 mm, same convention | Radius check passes; remaining checks evaluated separately |
| AC07 | Cable 2 kg/m, actual section path 5 m; containment/accessories 3 kg | Cable 10 kg; combined 13 kg |
| AC08 | A second cable instance is added | Area, arrangement and mass account for both physical cables |
| AC09 | Manufacturer radius, weight or usable envelope missing | Relevant result incomplete; missing weight never becomes zero |
| AC10 | Product/route/scale changes after validation | Affected results stale until recalculated |
| AC11 | Save/reopen and export | Identical IDs, inputs, placements and numeric results |
| AC12 | Recognised scale unconfirmed; PDF crossing ambiguous | Dimensional validation incomplete; no inferred junction |
| AC13 | Verified four-cable 150/300 mm bend assemblies | Match independently established results; width alone never fixes outcome |
| AC14 | Search limit reached | Fit error explaining no valid arrangement found within search; no claim of proven impossibility |
| AC15 | Local cleat restriction in otherwise clear section | Governing local fit/spare restriction is reported |
| AC16 | Structural/support-span panel | Shows deferred/not checked; weight remains available |

AC01–AC03 use synthetic areas to test arithmetic, not genuine product dimensions. Establish exact manufacturer-based benchmark geometry before claiming verified fit. Add unit-conversion, split/merge ownership, continuous path and report consistency cases as those features are implemented.

## 10 Data still to be supplied and managed assumptions

Owner will supply Legrand files. Record the actual filenames and coverage once provided. Prysmian outside diameters, weights and bend conditions also need verified source records. Record absent data in a data-gap register. No supplier dimensions, radius factors, support ratings or product references may be invented.

Development may proceed with the explicit initial unequal-diameter spacing convention, but flag it as an assumption for owner review. Stacking defaults must be visible and editable; show incomplete if no valid layer/envelope definition is available. Automatic product substitutions or increases in tray size require an explicit engineer action; suggestions can show their expected effects.

Detailed BS 7671 installation-method mapping, segregation rule automation, production security, billing and support-span design need separate specification before their respective milestones. Arrangement labels alone do not establish electrical compliance. Existing cable electrical sizing remains outside the application scope.

## 11 Working instructions for Cursor

- Read this brief before editing; retain requirement and acceptance IDs in implementation tasks.
- Inspect the repository first. Preserve existing user work; do not replace a working application without identifying what exists.
- If starting fresh, implement the proposed local proof-of-concept architecture and record any necessary deviations.
- Create a concise implementation plan and decision/data-gap registers, then implement Milestone 1 in small reviewable increments.
- Begin with schemas, units and pure calculation functions, then geometry/placement, then linked visuals. Avoid building a polished mockup with simulated results.
- Keep raw manufacturer sources unchanged. Distinguish fixture, assumed and verified data in the UI and reports.
- Run independent numeric tests, type checks and build checks. State what was actually tested and what remains incomplete.
- Use Git commits at stable milestones. Keep calculations and UI changes traceable. No hard-coded pass/fail demonstrations.
- Continue reversible development when data is absent using fixtures; do not invent production values or repeatedly ask about deferred features.

## 12 Starting prompt to paste into Cursor

Read @Cursor_AI_Development_Brief_v1.md as the implementation specification. Inspect this repository and list any existing assets and manufacturer files. Create an implementation plan, data-gap register and acceptance checklist. Then start Milestone 1: validated data models and unit handling, pure spare-area and weight calculations with AC01–AC09 tests where applicable, followed by the deterministic placement/bend engine and a linked plan/cross-section/3D proof of concept. Use clearly labelled synthetic fixtures until verified manufacturer data is supplied. Preserve one authoritative model, show incomplete states for missing required data, and defer support-span recommendations and billing. Do not hard-code the 150 mm or 300 mm outcomes. Document assumptions and run the checks available in the repository after each working increment.
