# Full Wiring Pass — Design Spec

**Date:** 2026-03-21
**Project:** agentflow-demo (10_agentflow-demo)
**Scope:** Wire all CRUD operations to frontend, complete tag system, surface hidden data
**Backlog refs:** US-DM-02 (tag system), US-DM-03 (tag filtering), quick wins from wiring analysis
**Approach decisions:** Junction table (A) + Inline HTML (A)

---

## 1. Problem Statement

The agentflow-demo backend is feature-complete (5 CRUD operations, health endpoint, tag list) with 28 passing tests, but the frontend is read-only. Four of five CRUD operations are unreachable from the browser. The tag system is a stub (model + seed data, no service, no UI, no task-tag relationship). Three API response fields (description, created_at, updated_at) are returned but never rendered.

### Wiring Gaps Identified

| Category | Wired | Gaps |
|----------|-------|------|
| API Endpoints | 3/8 | 5 endpoints unreachable from UI |
| UI Components | 4/15 needed | 11 missing |
| Model Fields | 3/7 Task fields shown | 4 hidden from users |
| Tag System | 0/4 layers | Model exists, everything else missing |

---

## 2. Success Criteria

1. All 5 Task CRUD operations are triggerable from the UI
2. Tag system is fully wired: model (TaskTag junction) → TagService → routes → UI
3. Task description, created_at, updated_at are visible in a detail view
4. Tag filtering works end-to-end (API param → UI dropdown → filtered results)
5. All existing 28 tests pass unchanged
6. 15+ new tests covering tag CRUD, task-tag assignment, tag filtering, cascade delete
7. No new packages added (CLAUDE.md constraint)
8. Service-first pattern maintained (CLAUDE.md constraint)

---

## 3. Data Layer

### 3.1 New Model: TaskTag (junction table)

```python
class TaskTag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    tag_id: int = Field(foreign_key="tag.id", index=True)

    class Config:
        table_args = (UniqueConstraint("task_id", "tag_id"),)
```

**Location:** `app/models.py`

### 3.2 Model Updates

**Task model** — add relationship:
```python
tags: list["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)
```

**Tag model** — add relationship:
```python
tags: list["Task"] = Relationship(back_populates="tags", link_model=TaskTag)
```

**TaskRead** — add tags field:
```python
class TaskRead(SQLModel):
    # ... existing fields ...
    tags: list[str] = []  # tag names, populated in service layer
```

**TaskCreate** — add optional tag_ids:
```python
class TaskCreate(SQLModel):
    # ... existing fields ...
    tag_ids: list[int] = []
```

**TaskUpdate** — add optional tag_ids:
```python
class TaskUpdate(SQLModel):
    # ... existing fields ...
    tag_ids: list[int] | None = None  # None = don't change, [] = clear all
```

### 3.3 New Schema: TagRead

```python
class TagRead(SQLModel):
    id: int
    name: str
```

### 3.4 Seed Data Update

Existing 5 tags remain. Add TaskTag associations so demo tasks start tagged:
- "Set up project structure" → refactor
- "Add health endpoint" → feature
- "Implement task CRUD" → feature
- "Add tag filtering" → feature
- "Write unit tests" → test
- "Add pagination" → feature

---

## 4. Service Layer

### 4.1 New: TagService

**Location:** `app/services.py` (same file, follows existing pattern)

```python
class TagService:
    def __init__(self, session: Session): ...

    def list_tags(self) -> list[Tag]:
        """Return all tags ordered by name."""

    def get_tag(self, tag_id: int) -> Tag | None:
        """Get single tag by ID."""

    def create_tag(self, name: str) -> Tag:
        """Create tag. Raises ValueError if name already exists."""

    def delete_tag(self, tag_id: int) -> bool:
        """Delete tag. Cascade removes TaskTag rows. Returns False if not found."""
```

### 4.2 Updated: TaskService

**Modified methods:**

- `create_task(data: TaskCreate) -> Task`
  - After creating task, create TaskTag rows for each `tag_id` in `data.tag_ids`
  - Ignore invalid tag_ids silently (don't fail the create)

- `update_task(task_id: int, data: TaskUpdate) -> Task | None`
  - If `tag_ids` is not None, delete existing TaskTag rows for this task, create new ones
  - Set-replace semantics: `tag_ids=[]` clears all tags, `tag_ids=None` leaves unchanged

- `list_tasks(status, sort_by, sort_dir, limit, tag) -> list[Task]`
  - Add optional `tag: str | None` parameter
  - When set, join through TaskTag + Tag to filter tasks that have the named tag

**New helper:**

- `_get_task_with_tags(task: Task) -> dict`
  - Converts Task to dict with `tags: list[str]` populated from relationship
  - Used by all methods that return TaskRead

---

## 5. Route Layer

### 5.1 Modified Routes

| Route | Method | Change |
|-------|--------|--------|
| `GET /api/tasks` | list_tasks | Add `tag: str \| None = None` query param, pass to service |
| `POST /api/tasks` | create_task | Body now accepts `tag_ids`, pass through to service |
| `PATCH /api/tasks/{id}` | update_task | Body now accepts `tag_ids`, pass through to service |
| `GET /api/tags` | list_tags | Rewire from inline query to `TagService.list_tags()`, return `list[TagRead]` |

### 5.2 New Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/tags` | create_tag | Create a new tag. Body: `{"name": "string"}`. Returns `TagRead`, 201. |
| `DELETE /api/tags/{tag_id}` | delete_tag | Delete tag + cascade TaskTag rows. Returns 204. 404 if not found. |

### 5.3 Response Format Change

All task endpoints now return tags in the response:
```json
{
  "id": 1,
  "title": "Add tag filtering",
  "description": "",
  "status": "todo",
  "priority": 4,
  "created_at": "2026-03-21T...",
  "updated_at": "2026-03-21T...",
  "tags": ["feature"]
}
```

---

## 6. UI Layer

All changes are inline in `app/templates/index.html`. No new files, no new packages.

### 6.1 Create Form (Quick Win)

- Collapsible panel above the task board, toggled by a "+ New Task" button
- Fields: title (text, required), description (textarea), priority (number, default 0)
- Tag assignment: checkbox list populated from `GET /api/tags`
- Submit → `POST /api/tasks` with JSON body → refresh board → collapse form
- Cancel button to dismiss without creating

### 6.2 Delete Button (Quick Win)

- Small `x` button on each task card (right side, next to priority badge)
- Click → browser `confirm("Delete this task?")` → `DELETE /api/tasks/{id}` → refresh board
- Styled subtle (muted color) to avoid visual clutter

### 6.3 Status Filter Dropdown (Quick Win)

- Added to existing sort bar: `<select>` with options: All / To Do / In Progress / Done
- Change → re-fetches with `?status=` query param
- "All" sends no status param (shows everything)

### 6.4 Task Detail Panel

- Click on task title → opens a slide-in panel (right side) or modal overlay
- Shows all fields: title, description (or "No description" placeholder), status, priority, created_at, updated_at
- Timestamps displayed as relative time ("2h ago") with full datetime on hover (title attribute)
- Tag chips displayed as colored pills
- Inline edit: click title/description/priority to edit in place, save on blur or Enter
- Status toggle: clickable badge that cycles todo → in_progress → done
- Tag edit: checkbox picker matching the create form
- Close button to dismiss panel

### 6.5 Tag Chips on Task Cards

- After the task title, render small colored pills for each tag
- Colors assigned deterministically from tag name hash (consistent across renders)
- Max 3 visible + "+N" overflow indicator if more than 3 tags

### 6.6 Tag Filter Dropdown

- Added to sort bar after status filter: `<select>` with options: All Tags + one option per tag
- Change → re-fetches with `?tag=` query param
- "All Tags" sends no tag param

### 6.7 Toast Notifications

- Fixed-position container (top-right)
- Auto-dismissing after 3 seconds
- Green for success ("Task created", "Task deleted"), red for errors
- Pure CSS animation (slide in, fade out)
- No library required

### 6.8 Visual Design

- All new elements follow existing design tokens (CSS custom properties in `:root`)
- Dark theme consistent with current surface/border/accent colors
- Form inputs match existing sort-bar select styling
- Detail panel uses `var(--surface)` background with `var(--border)` edges
- Tag chips: `border-radius: 12px`, small font, deterministic background colors

---

## 7. Test Plan

### 7.1 Existing Tests (28) — No Changes

All current tests in `tests/test_tasks.py` continue to pass. The `tag_ids` field is optional in TaskCreate/TaskUpdate, so existing payloads without it remain valid.

### 7.2 New Tests (~18)

**Tag CRUD (4 tests):**
- `test_list_tags` — returns seeded tags
- `test_create_tag` — POST /api/tags returns 201
- `test_create_duplicate_tag_returns_409` — duplicate name rejected
- `test_delete_tag` — DELETE /api/tags/{id} returns 204, tag gone

**Task-Tag Assignment (5 tests):**
- `test_create_task_with_tags` — POST /api/tasks with tag_ids, response includes tags
- `test_update_task_tags` — PATCH with tag_ids replaces tags
- `test_update_task_clear_tags` — PATCH with tag_ids=[] removes all tags
- `test_update_task_without_tag_ids_preserves_tags` — PATCH without tag_ids field doesn't touch tags
- `test_create_task_with_invalid_tag_ids_ignores_them` — invalid IDs silently skipped

**Tag Filtering (3 tests):**
- `test_list_tasks_filter_by_tag` — GET /api/tasks?tag=feature returns only tagged tasks
- `test_list_tasks_filter_by_nonexistent_tag_returns_empty` — unknown tag → empty list
- `test_list_tasks_filter_by_tag_and_status` — both params combine correctly

**Cascade Behavior (3 tests):**
- `test_delete_tag_removes_task_tag_associations` — deleting a tag cleans up junction rows
- `test_delete_task_removes_task_tag_associations` — deleting a task cleans up junction rows
- `test_tags_response_format` — verify tags field is list of strings in TaskRead

**Service Layer (3 tests):**
- `test_tag_service_list_tags_ordered` — alphabetical order
- `test_tag_service_create_duplicate_raises` — ValueError on duplicate
- `test_task_service_list_with_tag_filter` — service-level tag filtering

---

## 8. Migration Strategy

**No migration tool needed.** The app uses `SQLModel.metadata.create_all(engine)` on startup, which creates missing tables. Since this is a demo app with SQLite and seeded data:

1. Delete `demo.db` (recreated on next startup with seed data including TaskTag associations)
2. Test DB (`test.db`) is recreated per test run via `setup_module` / `teardown_module`

---

## 9. File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `app/models.py` | Modified | Add TaskTag model, TagRead schema, update relationships and schemas |
| `app/services.py` | Modified | Add TagService class, update TaskService methods |
| `app/main.py` | Modified | Add new routes, update existing routes, update seed data |
| `app/templates/index.html` | Modified | Add create form, delete buttons, filters, detail panel, tag chips, toasts |
| `tests/test_tasks.py` | Modified | Add ~18 new test cases |

**No new files. No new packages.**

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| index.html grows too large for maintainability | Low | Low | Demo app — complexity ceiling is inherently limited. Can extract JS later if needed. |
| SQLModel relationship loading causes N+1 queries | Medium | Low | Use `selectinload` or eager loading for tags relationship in list queries |
| Tag name collision on create | Low | Low | Unique constraint + 409 response |
| Existing tests break from response format change | Low | Medium | `tags` field defaults to `[]`, existing tests don't assert on field absence |

---

## 11. Backlog Status After Completion

| Item | Status |
|------|--------|
| US-DM-02 (Tag system) | DONE |
| US-DM-03 (Tag filtering) | DONE (unblocked by US-DM-02) |
| Quick wins (create, delete, status filter) | DONE |
| Hidden data (description, timestamps) | DONE |
| Critical path cleared | Yes — no remaining blockers |
