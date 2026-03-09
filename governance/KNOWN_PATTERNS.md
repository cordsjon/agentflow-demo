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

## 1. Configuration & Environment

| # | Anti-Pattern | Correct Pattern | Origin | Action |
|---|-------------|-----------------|--------|--------|
| 1 | **Evaluating settings at module import time** — value freezes, ignores runtime changes | Use `None` default + resolved method at call time | — | Fix |
| 2 | **Catching bare `Exception`** — hides system exits, OOM, permission errors | Catch specific exceptions: `OSError`, `ValueError`, `httpx.HTTPError` | — | Fix |
| 3 | **Import-time side effects** (creating semaphores, opening files at module level) | Defer to factory function, `__init__`, or startup handler | — | Fix |

## 2. Data & Sorting

| # | Anti-Pattern | Correct Pattern | Origin | Action |
|---|-------------|-----------------|--------|--------|
| 4 | **`dict.get(key, default)` when value can be `None`** — returns `None` not default | Use `dict.get(key) or default` to coerce `None` | Tether | Fix |
| 5 | **Loading all rows then checking count** against a limit — OOM at scale | Run `SELECT COUNT(*)` first, reject if over limit, then load | — | Fix |

## 3. Process & Infrastructure

| # | Anti-Pattern | Correct Pattern | Origin | Action |
|---|-------------|-----------------|--------|--------|
| 6 | **Bare `python` in scripts** — resolves to wrong venv on PATH | Use explicit venv path: `$TetherRoot\.venv\Scripts\python.exe` | Tether | Fix |
| 7 | **ngrok free-tier URLs assumed stable** — tunnels expire when process stops | Either use static domain (paid) or document restart procedure | Tether | Decide |
| 8 | **Semaphore read once at session start** — misses mid-session pause signals | Re-read semaphore file before EVERY loop iteration | — | Fix |

## 4. Frontend & CSS

| # | Anti-Pattern | Correct Pattern | Origin | Action |
|---|-------------|-----------------|--------|--------|
| 9 | **Hardcoded hex colors** instead of CSS custom properties | Extract to `:root` tokens, reference with `var(--name)` | — | Fix |
| 10 | **Hardcoded magic numbers** in JS duplicating Python constants | Read from DOM `data-` attributes set by templates | — | Fix |

## 5. Review & Analysis

| # | Anti-Pattern | Correct Pattern | Origin | Action |
|---|-------------|-----------------|--------|--------|
| 11 | **Omitting uncertainty declaration in findings** — reader acts on false confidence, wastes effort on incorrect assumptions | All review/analysis findings must declare what remains unknown or unverified. `Unknown:` clause **mandatory** for Investigate/Decide actions, **recommended** for Fix/Plan. Format: `[Action]: [finding] · Unknown: [what remains unverified]` | Governance | Fix |

---

_Last updated: 2026-03-09. Add new patterns as they emerge from retros and quality audits._
