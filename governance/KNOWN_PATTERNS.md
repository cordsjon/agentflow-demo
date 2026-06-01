# Known Patterns — Cross-Project Lessons Learned

> Anti-patterns identified across all governed projects.
> Claude MUST consult this before writing new code in any project.
> Project-specific patterns stay in project repos; patterns that recur across projects graduate here.

---

## FIPD Finding Taxonomy

Every pattern and finding is classified by **action type** — what the reader should do next:

| Action | Definition |
|--------|-----------|
| **Fix** | Root cause known, solution clear — implement immediately |
| **Investigate** | Symptom observed, root cause unknown — gather data before acting |
| **Plan** | Issue understood, solution direction known but requires design work — add to backlog |
| **Decide** | Trade-off identified, multiple valid directions exist — escalate to human decision-maker |

---

## Patterns

### KP-1: Settings evaluated at import time

**Category:** Configuration & Environment | **Action:** Fix | **Origin:** —

Evaluating settings at module import time freezes the value and ignores runtime changes.

**Correct pattern:** Use `None` default + resolved method at call time.

### KP-2: Catching bare Exception

**Category:** Configuration & Environment | **Action:** Fix | **Origin:** —

Catching bare `Exception` hides system exits, OOM, and permission errors.

**Correct pattern:** Catch specific exceptions: `OSError`, `ValueError`, `httpx.HTTPError`.

### KP-3: Import-time side effects

**Category:** Configuration & Environment | **Action:** Fix | **Origin:** —

Creating semaphores, opening files, or performing other side effects at module level causes unpredictable initialization order and test interference.

**Correct pattern:** Defer to factory function, `__init__`, or startup handler.

### KP-4: dict.get returns None instead of default

**Category:** Data & Sorting | **Action:** Fix | **Origin:** Tether

Using `dict.get(key, default)` when the value can be `None` returns `None` instead of the intended default.

**Correct pattern:** Use `dict.get(key) or default` to coerce `None`.

### KP-5: Loading all rows before checking count

**Category:** Data & Sorting | **Action:** Fix | **Origin:** —

Loading all rows then checking count against a limit risks OOM at scale.

**Correct pattern:** Run `SELECT COUNT(*)` first, reject if over limit, then load.

### KP-6: Bare python in scripts

**Category:** Process & Infrastructure | **Action:** Fix | **Origin:** Tether

Using bare `python` in scripts resolves to the wrong venv on PATH.

**Correct pattern:** Use explicit venv path: `$TetherRoot\.venv\Scripts\python.exe`.

### KP-7: ngrok free-tier URLs assumed stable

**Category:** Process & Infrastructure | **Action:** Decide | **Origin:** Tether

ngrok free-tier tunnel URLs expire when the process stops, breaking integrations that depend on a stable endpoint.

**Correct pattern:** Either use static domain (paid) or document restart procedure.

### KP-8: Semaphore read once at session start

**Category:** Process & Infrastructure | **Action:** Fix | **Origin:** —

Reading a semaphore file only once at session start misses mid-session pause signals.

**Correct pattern:** Re-read semaphore file before EVERY loop iteration.

### KP-9: Hardcoded hex colors

**Category:** Frontend & CSS | **Action:** Fix | **Origin:** —

Hardcoded hex colors instead of CSS custom properties make theming impossible and create maintenance burden.

**Correct pattern:** Extract to `:root` tokens, reference with `var(--name)`.

### KP-10: Hardcoded magic numbers in JS

**Category:** Frontend & CSS | **Action:** Fix | **Origin:** —

Hardcoded magic numbers in JS duplicating Python constants cause drift between frontend and backend.

**Correct pattern:** Read from DOM `data-` attributes set by templates.

### KP-11: Omitting uncertainty declaration in findings

**Category:** Review & Analysis | **Action:** Fix | **Origin:** Governance

Omitting uncertainty declarations in findings causes the reader to act on false confidence, wasting effort on incorrect assumptions.

**Correct pattern:** All review/analysis findings must declare what remains unknown or unverified. `Unknown:` clause **mandatory** for Investigate/Decide actions, **recommended** for Fix/Plan. Format: `[Action]: [finding] · Unknown: [what remains unverified]`.

---

_Last updated: 2026-03-25. Add new patterns as they emerge from retros and quality audits._
