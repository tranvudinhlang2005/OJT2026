# Ticket 01: Fix Balanced Visualization and Approvals Default Scope

## Status: READY
Blocked by: None

## Context & Problem
1. `.agents/rules/balanced-data-viz.md` Rule 3 requires adjacent chart cards and KPI widgets to share consistent structure and matching heights (`items-stretch`). In `FE/src/components/admin/dashboard/DashboardKPIs.tsx`, the grid container omits `items-stretch`.
2. `FE/docs/specs/admin-spec.md` Section 3.4 line 120 states that the default pending approvals view should filter classes with `status = IN_PROGRESS` and `gradingStatus = SUBMITTED`.

## Deliverables
1. Add `items-stretch` to the KPI grid in `DashboardKPIs.tsx`.
2. Align `ApprovalsPage.tsx` filter defaults with `admin-spec.md`.
3. Add or update unit tests to verify layout classes and filter initialization.
