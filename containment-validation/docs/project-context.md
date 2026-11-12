# Project context — Containment Design v1

Source of truth: `docs/Cursor_AI_Development_Brief_v1.md` (v1.0, 12 November 2026). This file restates stable goals, constraints and Milestone 1 scope for coordination. Where this summary and the brief diverge, the brief wins.

## Goals

- Validate whether previously sized cables fit selected containment, including changes of direction.
- Keep 2D plan, 3D model, cable schedule, area calculations and weights on one shared project model.
- Show the limiting cable, fitting or section and explain each result state.
- Deliver a local engineering proof of concept first; complete workflow, commercial features and structural modules later.

Brand line: Developed By Designers For Designers.

## Hard constraints

- PDF is the drawing input format (full workflow in later milestones).
- Do not invent Legrand/Prysmian dimensions, radius factors, support ratings or product references.
- Distinguish **fixture**, **assumed** and **verified** product data in UI and reports; fixtures never get manufacturer-verified status.
- Nominal tray width/depth ≠ usable internal envelope; store verified usable boundaries.
- Result states: `PASS`, `ERROR`, `INCOMPLETE`, `STALE`, `NOT_CHECKED`.
- Calculations must work without the AI companion.
- No hard-coded pass/fail for nominal 150 mm / 300 mm tray widths.
- Weight is reported now; support-span / structural adequacy stay deferred (`NOT_CHECKED`).
- Billing, auth and multi-user subscriptions stay out of calculation code.

## Naming (agreed)

- Section: `LEVEL-SERVICE-TYPE-NUMBER` (e.g. `L01-SM-TR-001`)
- Fitting: `LEVEL-SERVICE-TYPE-FT-NUMBER` (e.g. `L01-SM-TR-FT-001`)
- No building number in the reference.

## Milestone 1 scope (in)

Local browser proof of concept:

- Project record; product-data import/inspection
- Selected straight runs and a horizontal 90° bend
- Cable selection; automatic placement (touching / spaced / stacked)
- Linked cross-section, plan and 3D views
- Validation (area/spare, fit/placement, bend radius)
- Weight schedule
- Save / reopen
- Synthetic fixtures explicitly labelled; incomplete production-data state when manufacturer files are absent
- 150 mm and 300 mm tray examples only when matching verified geometry is supplied

## Milestone 1 scope (out)

- Milestone 2: PDF upload/render, scale detection/calibration, route sketching, cable import mapping, equipment endpoints
- Milestone 3: tees, reducers, rises/drops, multi-level routing, branded reports/revisions, full fitting families
- Milestone 4: AI companion, auth, org isolation, subscriptions, collaboration
- Recommended support spans and structural loading module
- Production billing; BS 7671 installation-method / segregation automation; cable electrical sizing

## Proposed stack (recommendation, not owner lock-in)

TypeScript + React + Vite; domain/engine packages independent of UI; worker for heavy placement; local persistence + JSON export/import; versioned product/project schemas. See `docs/decisions.md` and `docs/implementation-plan.md`.
