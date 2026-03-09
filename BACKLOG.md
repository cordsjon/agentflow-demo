# Backlog

## Critical Path

- US-DM-03 Task filtering (needs: US-DM-02 Tag system)
- US-DM-02 Tag system (blocks: US-DM-03)

## Ideation

- [ ] **Batch operations** — select multiple tasks and change status/delete in one action
  _Origin: operator feedback during demo recording_

- [ ] **Export to CSV** — download task list as CSV for reporting
  _Origin: planning round 2026-03-08_

- [ ] **Keyboard shortcuts** — j/k navigation, x to toggle status, n for new task
  _Origin: power user request_

## Refining

- [ ] **US-DM-02: Tag system** `#1`
  _Spec: Tasks can have multiple tags. Tags are created on-the-fly. Filter by tag in list view._
  _AC: POST /api/tasks accepts `tags: ["bug", "feature"]`. GET /api/tasks?tag=bug returns filtered list._
  _Architecture: Many-to-many via TaskTag join table. Tag entity already exists._
  _Status: spec complete, needs spec-panel review_
  needs: none · blocks: US-DM-03

- [ ] **US-DM-04: Task description markdown** `#3`
  _Spec: Description field supports markdown. Rendered in UI detail view._
  _AC: Markdown stored as-is. GET returns raw. UI renders with marked.js (CDN)._
  _Status: needs architecture decision — CDN or vendor locally?_

## Ready

- [ ] **US-DM-01: Priority sorting in UI** `#1`
  _Spec: Task list sorted by priority (ascending). Drag-to-reorder updates priority via PATCH._
  _AC: GET /api/tasks returns priority-sorted. UI reflects order. Drag reorder calls PATCH._
  _Tests: test_tasks.py — test_list_sorted_by_priority, test_reorder_updates_priority_
  _Size: S_

- [ ] **US-DM-03: Tag filtering** `#2`
  _Spec: Filter task list by one or more tags. UI shows tag chips with click-to-filter._
  _AC: GET /api/tasks?tag=bug returns only tagged tasks. Multiple tags = OR filter._
  _Tests: test_tasks.py — test_filter_by_tag, test_filter_multiple_tags_
  _Size: M_
  needs: US-DM-02

- [ ] **US-DM-05: Health endpoint resilience** `#3`
  _Spec: /api/health returns 503 when DB is unreachable. Includes uptime + version._
  _AC: Health returns {"status": "degraded", "error": "..."} with 503 on DB failure._
  _Tests: test_health.py — test_health_db_missing_returns_503_
  _Size: S_

## Risks

R-1 · CDN dependency for marked.js could break in air-gapped environments · L=M I=L · Vendor locally as fallback · unassigned
