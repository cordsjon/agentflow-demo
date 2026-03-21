# US-DM-06: Governance Narrative Panel — Design Spec

**Date:** 2026-03-21
**Project:** agentflow-demo (10_agentflow-demo)
**Scope:** Add a read-only governance panel to the UI showing live pipeline state
**Backlog ref:** US-DM-06
**Origin:** Business-panel review (Osterwalder/Drucker, 2026-03-21) — "the spec wires backend→frontend but not app→governance-story"

---

## 1. Problem Statement

**System boundary:** single-user local app, no authentication, no external API integrations, SQLite file database + symlinked governance markdown files. All changes within `app/` directory.

The agentflow-demo is a governance demonstration vehicle — its job is to make the agentflow loop tangible, inspectable, and credible for developers evaluating the framework. After the full wiring pass, the task board is fully functional (CRUD, tags, filters, detail panel), but nothing in the UI connects the task manager to the governance pipeline. An evaluator sees a generic task board. The loop (INBOX → BACKLOG → TODO-Today → DONE-Today) and its autopilot executor are invisible.

This is the demo's core value gap: the governance story — the reason this app exists — is not told by the app itself.

### What evaluators see today

A dark-themed task board with 3 columns, a create form, sort/filter controls, and a detail panel. Functionally complete but indistinguishable from any other todo app.

### What evaluators should see

The task board **plus** a governance panel showing the live pipeline state: how items flow through stages, what's queued for execution, what's been completed, and whether the autopilot loop is running.

---

## 2. Success Criteria

1. A "Governance" view is accessible from the UI (tab or toggle)
2. The governance panel displays live state from 4 pipeline files: INBOX.md, BACKLOG.md, TODO-Today.md, DONE-Today.md
3. Autopilot semaphore status (`.autopilot` file) is visible as a live indicator
4. Pipeline stage counts are accurate (Ideation / Refining / Ready / Done items from BACKLOG)
5. TODO-Today queue shows checked/unchecked items with progress percentage
6. DONE-Today shows recent completions as a rolling feed
7. INBOX shows raw item count
8. The panel is read-only — no mutations to governance files
9. All existing 42 tests pass unchanged
10. 12 new tests covering governance service parsing, edge cases, and API endpoint
11. No new packages (CLAUDE.md constraint)
12. Service-first pattern maintained (CLAUDE.md constraint)

---

## 3. Data Sources

All governance files are plain markdown, symlinked into the project root or available at known paths.

| File | Location | What to extract |
|------|----------|----------------|
| `INBOX.md` | Project root | Raw item count (lines starting with `- `) |
| `BACKLOG.md` | Symlink → `../00_Governance/BACKLOG.md` | Stage counts under the `# Agentflow Demo` section only: Ideation / Refining / Ready / Done item counts |
| `TODO-Today.md` | Symlink → `../00_Governance/TODO-Today.md` | Items under the Agentflow Demo section (if present) or a general summary. Checked (`- [x]`) vs unchecked (`- [ ]`) counts |
| `DONE-Today.md` | Symlink → `../00_Governance/DONE-Today.md` | Recent completion entries (date headers + descriptions) |
| `.autopilot` | Project root | File content: `run` / `pause` / absent = stopped |

### Parsing Strategy

Simple regex-based extraction — no markdown parser library needed:

- **BACKLOG sections:** Match `## Ideation`, `## Refining`, `## Ready`, `## Done` headers under `# Agentflow Demo`. Count lines matching `^- ` (no leading whitespace) between consecutive `## ` headers. Indented lines (sub-bullets, descriptions) are not counted as separate items.
- **TODO-Today items:** Match `- [ ]` and `- [x]` patterns. Count each.
- **DONE-Today entries:** Match `## YYYY-MM-DD` date headers and their content blocks.
- **INBOX items:** Count lines matching `^- `.
- **Autopilot:** Read `.autopilot` file content, strip whitespace. If file absent, status is "stopped".

### Scoping to Agentflow Demo

BACKLOG.md and TODO-Today.md are cross-project files. The parser SHALL extract only the `# Agentflow Demo` section from BACKLOG.md. For TODO-Today.md, if an `# Agentflow Demo` section exists, parse only that; otherwise return an empty queue with a note that no agentflow items are queued.

### Worked Example — BACKLOG Section Scoping

```
Given BACKLOG.md contains:
  # SVG-PAINT
  ## Ideation
  - Item A
  - Item B
  # Agentflow Demo
  ## Ideation
  - Item C
  - Item D (with nested description)
    - Sub-bullet (not counted)
  ## Ready
  - Item E

Then _parse_backlog() returns:
  BacklogState(ideation=2, refining=0, ready=1, done=0)
  (Only Agentflow Demo section parsed. Sub-bullets excluded.)
```

---

## 4. Data Layer

### 4.1 New Schema: GovernanceState

No database table — these are response-only schemas (never persisted). Using SQLModel as base class for consistency with existing codebase, but these are purely Pydantic models.

```python
class GovernanceState(SQLModel):
    """Snapshot of governance pipeline state, parsed from markdown files."""
    inbox_count: int
    backlog: BacklogState
    todo: TodoState
    done: list[DoneEntry]
    autopilot: str  # "run" | "pause" | "stopped"

class BacklogState(SQLModel):
    ideation: int
    refining: int
    ready: int
    done: int

class TodoState(SQLModel):
    total: int
    checked: int
    unchecked: int
    items: list[TodoItem]

class TodoItem(SQLModel):
    text: str
    checked: bool

class DoneEntry(SQLModel):
    date: str
    title: str
    details: str
```

---

## 5. Service Layer

### 5.1 New: GovernanceService

**Location:** `app/services.py`

```python
class GovernanceService:
    """Read-only service parsing governance markdown files into structured state."""

    def __init__(self, base_path: str = "."):
        self._base = base_path

    def get_state(self) -> GovernanceState:
        """Parse all governance files and return structured state."""

    def _parse_inbox(self) -> int:
        """Count items in INBOX.md."""

    def _parse_backlog(self) -> BacklogState:
        """Extract Agentflow Demo section stage counts from BACKLOG.md."""

    def _parse_todo(self) -> TodoState:
        """Extract checked/unchecked items from TODO-Today.md."""

    def _parse_done(self) -> list[DoneEntry]:
        """Extract recent completion entries from DONE-Today.md."""

    def _read_autopilot(self) -> str:
        """Read .autopilot semaphore. Returns 'run', 'pause', or 'stopped'."""
```

**Key design decisions:**
- No database session needed — this service reads files, not DB
- Constructor takes `base_path` for testability (inject test fixtures instead of real governance files)
- Each parser method is independent and handles missing files gracefully (returns zero/empty, never raises)
- `get_state()` calls all parsers and assembles the response

**Graceful degradation contract:** If any governance file is missing or its symlink is broken, the corresponding field in GovernanceState returns a zero/empty default. The `autopilot` field returns `"stopped"`. The API SHALL always return 200 — never 500 — regardless of file availability. This ensures the demo works even when cloned without the parent `00_Governance/` directory.

---

## 6. Route Layer

### 6.1 New Endpoint

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /api/governance` | get_governance | Returns `GovernanceState` JSON. No auth, no params. |

```python
@app.get("/api/governance", response_model=GovernanceState)
def get_governance():
    svc = GovernanceService(base_path=".")
    return svc.get_state()
```

No database dependency — this route does not use `get_db()`.

### 6.2 Response Example

```json
{
  "inbox_count": 4,
  "backlog": {
    "ideation": 4,
    "refining": 1,
    "ready": 0,
    "done": 5
  },
  "todo": {
    "total": 0,
    "checked": 0,
    "unchecked": 0,
    "items": []
  },
  "done": [
    {
      "date": "2026-03-21",
      "title": "Full Wiring Pass — CRUD UI, tag system, hidden data",
      "details": "42 tests passing. US-DM-01/02/03/05 shipped."
    }
  ],
  "autopilot": "stopped"
}
```

---

## 7. UI Layer

All changes inline in `app/templates/index.html`. No new files, no new packages.

### 7.1 View Toggle

- Two tabs above the board: **Tasks** | **Governance**
- Tasks view shows the existing task board (default)
- Governance view shows the pipeline panel
- Active tab highlighted with `var(--accent)` underline
- **Keyboard:** Arrow Left/Right moves focus between tabs and activates. Home/End jumps to first/last tab. Tab key moves focus *into* the active tabpanel content, not between tabs.
- **Accessibility:** `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`. Only the active tabpanel has `tabindex="0"`; the hidden one has `hidden` attribute and is removed from the accessibility tree.

### 7.2 Pipeline Flow Visualization

- Horizontal flow diagram at the top of the governance panel:
  ```
  INBOX (4) → BACKLOG → TODO (0/0) → DONE (5)
  ```
- BACKLOG expands inline to show sub-stages: `Ideation (4) | Refining (1) | Ready (0)`
- Each stage is a rounded box with the count as a badge
- Connected by arrow characters or thin CSS lines
- Color-coded: items in Ready = green (actionable), items in Ideation = muted (not yet actionable)
- Styled with existing CSS custom properties (dark theme)

### 7.3 Autopilot Indicator

- Circular indicator next to the pipeline flow (or in the header area)
- Green pulsing dot for `run`, yellow static triangle for `pause`, grey static dot for `stopped` (shape + color, not color alone — accessible for color-blind users)
- Text label is the primary indicator: "Autopilot: Running" / "Autopilot: Paused" / "Autopilot: Stopped". Dot/shape is supplementary.
- CSS animation for pulsing (respects `prefers-reduced-motion`)

### 7.4 Queue Monitor (TODO-Today)

- Card showing TODO-Today state for the agentflow project
- Progress bar: `checked / total` with percentage
- List of items: checked items greyed/struck-through, unchecked items in normal text
- If no agentflow items in queue: "No items queued" placeholder
- Styled as a `.card` matching existing board cards

### 7.5 Completion Log (DONE-Today)

- Card showing recent completions, most recent first
- Each entry: date badge + title + details (truncated to 2 lines)
- Max 5 most recent entries displayed, with "Show more" button that renders additional entries inline if more exist
- Timestamps use the same relative time format as the task detail panel

### 7.6 INBOX Preview

- Small card or badge showing inbox item count
- Items displayed directly as plain text list (no expand/collapse — inbox items are typically few). If >5 items, show first 5 with a "+N more" truncation.

### 7.7 Auto-Refresh

- Governance panel fetches `GET /api/governance` on tab activation
- Optional: poll every 30 seconds while the governance tab is active (not while tasks tab is active)
- Manual refresh button in the panel header

### 7.8 Responsive

- On mobile (below 640px): pipeline flow wraps to vertical layout (stacked stages)
- Cards stack in single column
- Autopilot indicator moves into the panel header

---

## 8. Test Plan

### 8.1 Existing Tests (42) — No Changes

All current tests pass unchanged. The governance endpoint reads files, not the database.

### 8.2 New Tests (~10)

**GovernanceService unit tests (6):**
- `test_parse_inbox_counts_items` — fixture INBOX.md with 4 items → count = 4
- `test_parse_inbox_missing_file_returns_zero` — no file → count = 0
- `test_parse_backlog_extracts_agentflow_section` — fixture with multiple project sections → only agentflow counts
- `test_parse_todo_counts_checked_unchecked` — fixture with mixed checkboxes → correct counts
- `test_read_autopilot_run` — fixture file containing "run" → "run"
- `test_read_autopilot_missing_returns_stopped` — no file → "stopped"

**Edge case tests (2):**
- `test_parse_backlog_ignores_other_project_sections` — fixture with SVG-PAINT + KETO + Agentflow sections → only Agentflow counts returned
- `test_governance_with_missing_files_returns_defaults` — point GovernanceService at empty directory → all fields zero/empty, API returns 200

**API endpoint tests (4):**
- `test_governance_endpoint_returns_200` — GET /api/governance returns 200
- `test_governance_response_structure` — response has all expected fields
- `test_governance_inbox_count_matches` — inbox_count matches INBOX.md in test fixtures
- `test_governance_autopilot_status` — autopilot field is one of "run", "pause", "stopped"

### 8.3 Test Fixtures

Create a `tests/fixtures/governance/` directory with minimal markdown files for controlled testing. The GovernanceService constructor accepts `base_path`, so tests point to fixtures instead of real governance files.

---

## 9. File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `app/models.py` | Modified | Add GovernanceState, BacklogState, TodoState, TodoItem, DoneEntry schemas |
| `app/services.py` | Modified | Add GovernanceService class with file parsing methods |
| `app/main.py` | Modified | Add GET /api/governance route |
| `app/templates/index.html` | Modified | Add tab toggle, governance panel with pipeline flow, autopilot indicator, queue monitor, completion log, inbox preview |
| `tests/test_tasks.py` | Modified | Add ~10 new tests for governance endpoint and service |
| `tests/fixtures/governance/` | New directory | Test fixture markdown files |

**No new packages.**

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Governance files are symlinks that may not resolve in all environments | Medium | Medium | GovernanceService handles missing files gracefully (returns zeros/empty). Log a warning if symlinks don't resolve. |
| BACKLOG.md format changes break parser | Low | Medium | Parser is section-header based, not line-format dependent. Regex matches `## Stage` headers which are stable. |
| Cross-project files contain sensitive info from other projects | Low | Low | Parser scopes to `# Agentflow Demo` section only. Other project sections are never exposed. |
| Polling every 30s creates unnecessary load | Low | Low | Only poll while governance tab is active. File reads are cheap on local filesystem. |
| index.html continues to grow (now ~400 lines of JS) | Medium | Low | Demo app ceiling. If this becomes a problem, extract to `app/static/app.js` in a future pass. |

---

## 11. Backlog Status After Completion

| Item | Status |
|------|--------|
| US-DM-06 (Governance Narrative Panel) | DONE |
| Demo differentiator | Active — evaluators can see the governance loop |
