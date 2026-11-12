# Milestone 1 status (after Increment E)

Authority: `Cursor_AI_Development_Brief_v1.md`.

## Delivered in M1 increments A–E

| Increment | Content | PR |
|---|---|---|
| A+B | Schemas, units, statuses, provenance, spare-area, weight | #1 |
| C | Placement + bend engines | #2 |
| D | Linked plan / cross-section / 3D / issues / weights + AC10 stale | #4 |
| E | Save/reopen/export, dashboard, design basis, fixture packaging | this PR |

Acceptance: AC01–AC11, AC14–AC16 covered by tests/UI stubs. AC12 deferred (M2). AC13 blocked on verified geometry (DG08).

## Still incomplete inside M1 (data / polish)

- Verified Legrand / Prysmian catalogue empty (`data/verified/`) — incomplete production-data state remains
- Stacked arrangement editable on design basis but calculation path in the demo project still focuses on touching/spaced until fully wired through the workspace demo inputs
- 3D is engineered SVG isometric (PoC), not a full WebGL scene
- No issued immutable revision snapshots beyond project JSON export

## Deferred to M2+

| Item | When |
|---|---|
| PDF upload, scale detect/calibrate, route sketch, cable CSV, equipment endpoints (AC12) | M2 |
| Tees, reducers, rises/drops, multi-level, branded reports/revisions | M3 |
| AI companion, auth, org isolation, subscriptions | M4 |
| Support spans / structural adequacy (beyond `NOT_CHECKED`) | Separate module |
| AC13 verified 150/300 mm bend assemblies | After owner-supplied verified geometry |
