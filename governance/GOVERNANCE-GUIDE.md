# Governance Guide — Visual Reference

> **The complete visual reference for the governance system.**
> ASCII diagrams, worked examples, dictionary, and agent registry.
> All other governance docs are normative; this one is explanatory.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The Three Loops](#2-the-three-loops)
3. [Pipeline Flow — End to End](#3-pipeline-flow--end-to-end)
4. [Stage Lifecycle](#4-stage-lifecycle)
5. [Orchestrator & Routing](#5-orchestrator--routing)
6. [Agent Registry](#6-agent-registry)
7. [Quality Gates](#7-quality-gates)
8. [File Map](#8-file-map)
9. [Worked Examples](#9-worked-examples)
10. [Dictionary](#10-dictionary)
11. [Quick Reference Card](#11-quick-reference-card)

---

## 1. System Overview

```
                    ┌──────────────────────────────────────────────┐
                    │             GOVERNANCE REPO                  │
                    │  (central authority — synced to all projects) │
                    │                                              │
                    │  CLAUDE-LOOP.md    ORCHESTRATOR.md           │
                    │  DOR.md            AGENT_CAPABILITIES.md     │
                    │  DOD.md            KNOWN_PATTERNS.md         │
                    │  ROADMAP.md        BACKLOG.md                │
                    └─────────────────────┬────────────────────────┘
                                          │
                              governance/ sync
                                          │
           ┌──────────┬──────────┬────────┴────────┬──────────┐
           │          │          │                  │          │
      ┌────┴────┐ ┌───┴───┐ ┌───┴────┐ ┌──────────┴┐ ┌──────┴───┐
      │ProjectA │ │Tether │ │ProjectB│ │ProjectC   │ │ProjectD  │
      │         │ │ :7890 │ │        │ │           │ │          │
      └─────────┘ └───────┘ └────────┘ └───────────┘ └──────────┘
           │          │
           │    Tether Message Bus
           │    ┌─────┴─────────────────────┐
           │    │         tether.db          │
           │    │    (BLAKE3 · LC-B · MCP)   │
           │    └─────┬─────────────────────┘
           │          │
      ┌────┴──────────┼──────────────┐
      │               │              │
  ┌───┴───┐     ┌─────┴───┐   ┌─────┴───┐
  │Claude │     │ Gemini  │   │ChatGPT  │
  │ @claude│    │ @gemini │   │@chatgpt │
  │ACTIVE │     │  STUB   │   │  STUB   │
  └───────┘     └─────────┘   └─────────┘
```

**Core principle:** Governance files are the single source of truth.
Every project gets a `governance/` directory synced from the central repo.
Agents communicate via Tether. The orchestrator routes tasks to agents.

---

## 2. The Three Loops

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  OUTER LOOP (human-driven)                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  User / planning populates TODO-Today.md via /workflow        │  │
│  │  Every batch ends with a quality tail task                    │  │
│  │                                                               │  │
│  │  INBOX → BACKLOG (Ideation → Refining → Ready) → /workflow   │  │
│  └──────────────────────────────┬────────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│  INNER LOOP (autopilot — Claude-driven)                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  1. Check .autopilot semaphore ──── pause? ──→ STOP         │   │
│  │                    │                                         │   │
│  │                    ▼ run                                     │   │
│  │  2. Read next - [ ] from TODO-Today.md                      │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  3. ROUTE ─── orchestrator assigns @agent, preloads context │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  4. DOR check ──── fail? ──→ .claude-action, pause          │   │
│  │                    │                                         │   │
│  │                    ▼ pass                                    │   │
│  │  5. Execute task                                            │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  6. CLEANUP SUB-LOOP (see below)                            │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  7. Commit (atomic, per DOD)                                │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  8. queue done → DONE-Today + completion cascade            │   │
│  │                    │                                         │   │
│  │                    ▼                                         │   │
│  │  9. More tasks? ── yes ──→ loop to step 1                  │   │
│  │            │                                                 │   │
│  │            no                                                │   │
│  │            ▼                                                 │   │
│  │       "Queue complete" → STOP                               │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CLEANUP SUB-LOOP (nested inside inner loop step 6)                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  run greenlight ──→ review findings                         │   │
│  │       │                                                      │   │
│  │       ├── Low findings? ──→ fix → re-run greenlight (loop)  │   │
│  │       │                                                      │   │
│  │       ├── Medium/High? ──→ pause autopilot → STOP           │   │
│  │       │                                                      │   │
│  │       └── All clear ──→ continue to step 7                  │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pipeline Flow — End to End

```
USER INPUT (any message without /q prefix)
     │
     ▼
┌──────────┐     ┌──────────────────────────────────────────────────┐
│ INBOX.md │ ──→ │ /triage                                         │
└──────────┘     │   Classify: [feature] [bug] [hotfix] [research] │
                 │   Assign priority #N                             │
                 │   Write to BACKLOG.md section                    │
                 └────────────────┬─────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKLOG.md                                  │
│                                                                     │
│  ┌──────────┐   /sc:brainstorm   ┌──────────┐   /sc:spec-panel    │
│  │ Ideation │ ─────────────────→ │ Refining │ ──────────────────→  │
│  │          │                    │          │   gate: DOR + >=7.0  │
│  └──────────┘                    └──────────┘          │           │
│                                                        ▼           │
│                                               ┌──────────┐        │
│                                               │  Ready   │        │
│                                               │  #N pri  │        │
│                                               └────┬─────┘        │
└────────────────────────────────────────────────────┬───────────────┘
                                                     │
                                              /sc:workflow
                                                     │
                                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       TODO-Today.md                                 │
│                                                                     │
│  > >>> NEXT                                                        │
│  - [ ] **implement** US-01 ... `@claude` `stall:0`                 │
│    `/sc:implement "..." --focus backend`                           │
│    _Context: files, risk flags -- confidence:0.95_                 │
│  - [ ] **test** US-01 ...                                          │
│  - [ ] **analyze** quality tail ...                                │
│  - [ ] **cleanup** quality tail ...                                │
│  - [ ] **commit** quality tail ...                                 │
│  - [ ] **deploy** quality tail ...                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                          /autopilot
                        (inner loop)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DONE-Today.md                                  │
│                                                                     │
│  - [x] **implement** US-01 ... (14:32)                             │
│  - [x] **test** US-01 ... (14:45)                                  │
│  - [x] **deploy** ... (15:02)                                      │
│                                                                     │
│  Archive: done/DONE-2026-W10.md (auto at 200 lines)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Stage Lifecycle

```
             ┌────────────────── STAGE GATES ──────────────────┐
             │                                                  │
   IDEATION ──→ REFINING ──→ READY ──→ QUEUED ──→ EXECUTING ──→ DONE
      │            │           │          │           │           │
      │            │           │          │           │           │
   brainstorm   spec+US+AC  DOR pass  /workflow   autopilot   DOD pass
   output       exists       >=7.0    generates   runs task    commit
   exists                    score    queue                    deployed
```

### Gate Details

| Gate | Check | Fails → |
|------|-------|---------|
| **Ideation → Refining** | `/sc:brainstorm` output exists | Stay in Ideation |
| **Refining → Ready** | DOR checklist + spec-panel >= 7.0 | Stay in Refining, iterate |
| **Ready → Queued** | `/sc:workflow` generates queue items | N/A (manual trigger) |
| **Queued → Executing** | Semaphore = `run`, DOR re-check | Pause autopilot |
| **Executing → Done** | Greenlight pass + DOD checklist | Pause autopilot (Medium+) |

---

## 5. Orchestrator & Routing

```
                    TODO-Today.md
                    ┌────────────────────────────┐
                    │ - [ ] **implement** FE-32  │
                    │   /sc:implement "..."       │
                    │   _Context: files..._       │
                    └─────────────┬──────────────┘
                                  │
                           ROUTE PHASE
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                    │
              ▼                   ▼                    ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   @claude       │ │   @gemini       │ │   @chatgpt      │
    │   weight: 1.0   │ │   weight: 0.0   │ │   weight: 0.0   │
    │   ACTIVE        │ │   STUB          │ │   STUB          │
    └────────┬────────┘ └─────────────────┘ └─────────────────┘
             │
        SCORING:
        keyword_match    = +3 (implement, font, preview)
        context_bonus    = +2 (has repo access)
        constraint_pen   =  0
        ─────────────────────
        total            =  5  → confidence: 1.0
             │
             ▼
    ┌─────────────────────────────────────┐
    │ - [ ] **implement** FE-32          │
    │       `@claude` `stall:0`          │  ← annotated
    │   _Context: ... -- confidence:1.0_ │
    └─────────────────────────────────────┘
```

### Stall Escalation Ladder

```
  Normal ──→ stall:1 ──→ stall:2 ──→ stall:3
    │           │           │           │
    │        log warn    .claude-     pause
    │                    action       autopilot
    │                    warning      + toast
    │                                 + escalate
    │
    └── Reset: any .claude-action change or .claude-activity mtime advance
```

### Completion Cascade

```
  Task X completed (queue done)
       │
       ├──→ Check BACKLOG: any item with "needs: X"?
       │         │
       │         yes ──→ Is it Ready? ──→ Suggest queuing with @agent
       │         │
       │         no ──→ Skip
       │
       ├──→ Reset stall counter on slot
       │
       └──→ Queue <= 1 unchecked? ──→ Suggest planning round (PO-05)
```

---

## 6. Agent Registry

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AGENT REGISTRY                                │
├──────────┬──────────┬───────────────────────────────┬───────────────┤
│ Agent    │ Status   │ Transport                     │ Best For      │
├──────────┼──────────┼───────────────────────────────┼───────────────┤
│ @claude  │ ACTIVE   │ Native CLI + MCP (13 tools)   │ Implementation│
│          │          │ Full repo access               │ Testing       │
│          │          │ vexp + GitNexus indexes        │ Bug fixes     │
│          │          │                               │ Migrations    │
│          │          │                               │ Architecture  │
├──────────┼──────────┼───────────────────────────────┼───────────────┤
│ @gemini  │ STUB     │ Google Sheets bridge           │ Research      │
│          │          │ Tether HTTP API                │ Large-context │
│          │          │ (2min polling)                 │ Spec review   │
│          │          │                               │ SEO/Market    │
├──────────┼──────────┼───────────────────────────────┼───────────────┤
│ @chatgpt │ STUB     │ Google Sheets bridge           │ Copywriting   │
│          │          │ Manual paste                   │ Marketing     │
│          │          │                               │ Help guides   │
│          │          │                               │ Localization  │
├──────────┼──────────┼───────────────────────────────┼───────────────┤
│ @grok    │ STUB     │ Google Sheets bridge           │ Real-time     │
│          │          │ Manual paste                   │ Trend analysis│
│          │          │                               │ Code review   │
└──────────┴──────────┴───────────────────────────────┴───────────────┘

Activation path:  STUB ──→ transport verified ──→ first contact
                       ──→ test task ──→ weight set ──→ ACTIVE
```

---

## 7. Quality Gates

```
┌─────────────────────────────────────────────────────────────────────┐
│                      QUALITY GATE STACK                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ DOR (Definition of Ready) — ENTRY gate                       │  │
│  │                                                               │  │
│  │  [ ] User Stories defined (As a..., I want..., So that...)   │  │
│  │  [ ] Acceptance Criteria (Given/When/Then)                   │  │
│  │  [ ] Spec document exists                                    │  │
│  │  [ ] Spec-panel score >= 7.0                                 │  │
│  │  [ ] Architecture decided (if new modules)                   │  │
│  │  [ ] Dependencies identified                                 │  │
│  │  [ ] Test strategy known                                     │  │
│  │  [ ] No constraint violations                                │  │
│  │  [ ] Size estimated (S/M/L)                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ GREENLIGHT — EXECUTION gate (run after every implementation) │  │
│  │                                                               │  │
│  │  python -m app.cli.main greenlight --all                     │  │
│  │                                                               │  │
│  │  Low findings   → auto-fix loop                              │  │
│  │  Medium+ findings → PAUSE autopilot, human review            │  │
│  │                                                               │  │
│  │  Finding Classification (FIPD taxonomy):                      │  │
│  │  Fix         = root cause known, implement immediately        │  │
│  │  Investigate = symptom observed, gather data first             │  │
│  │  Plan        = direction known, needs design work             │  │
│  │  Decide      = trade-off, escalate to human                   │  │
│  │  See KNOWN_PATTERNS.md for full definitions + examples.       │  │
│  │  Investigate/Decide findings require Unknown: clause.         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ DEEP AUDIT — optional, M+ size tasks only                    │  │
│  │                                                               │  │
│  │  /production-code-audit                                       │  │
│  │  Security, performance, architecture deep scan                │  │
│  │  Runs between /sc:analyze and /sc:cleanup                     │  │
│  │  Skipped for S (small) tasks                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ DOD (Definition of Done) — EXIT gate                         │  │
│  │                                                               │  │
│  │  Code Quality:                                               │  │
│  │  [ ] Tests exist + pass                                      │  │
│  │  [ ] Quality audit clean (Low only)                          │  │
│  │  [ ] Low findings fixed by /sc:cleanup                       │  │
│  │                                                               │  │
│  │  Architecture:                                               │  │
│  │  [ ] Service-first (logic in services, not routes)           │  │
│  │  [ ] No constraint violations                                │  │
│  │  [ ] Backward compatible                                     │  │
│  │                                                               │  │
│  │  Committed:                                                  │  │
│  │  [ ] Clean atomic commit                                     │  │
│  │  [ ] No secrets in code                                      │  │
│  │  [ ] Pre-commit hooks pass                                   │  │
│  │                                                               │  │
│  │  Deployable:                                                 │  │
│  │  [ ] App starts, no crash                                    │  │
│  │  [ ] Existing functionality intact                           │  │
│  │                                                               │  │
│  │  Pipeline:                                                   │  │
│  │  [ ] TODO-Today item checked                                 │  │
│  │  [ ] DONE-Today updated with timestamp                       │  │
│  │  [ ] BACKLOG source item marked done                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. File Map

### Governance Repo (source of truth)

```
D:\Temp\git\Governance\
├── CLAUDE-LOOP.md          ← The loop definition (outer + inner + cleanup)
├── ORCHESTRATOR.md         ← Routing layer (phase inside autopilot)
├── AGENT_CAPABILITIES.md   ← Agent manifest (strengths, constraints, weights)
├── GOVERNANCE-GUIDE.md     ← This file (visual reference)
├── DOR.md                  ← Entry gate (before implementation)
├── DOD.md                  ← Exit gate (before deployment)
├── KNOWN_PATTERNS.md       ← Cross-project anti-patterns
├── BACKLOG.md              ← Cross-project priority authority
├── ROADMAP.md              ← Strategic initiatives + BV scores
├── CLAUDE.md               ← Governance repo's own instructions
├── Gemini.md               ← Gemini/Grok connection playbook
├── requirements/
│   └── REQ_PO_CAPABILITIES.md
├── templates/
│   └── PROJECT_GOVERNANCE_SNIPPET.md
└── exports/
    ├── AgentFlow-Governance-Cheatsheet.pdf  ← 2-page printable cheat sheet
    └── Governance-Dashboard.xlsx            ← Auto-synced backlog/roadmap
```

### Cheat Sheet

A **2-page A4 landscape PDF** covering the entire governance system sequenced by daily workflow:

![AgentFlow Governance Cheat Sheet — Page 1](exports/cheatsheet-page1.png)

**Download:** [AgentFlow-Governance-Cheatsheet.pdf](exports/AgentFlow-Governance-Cheatsheet.pdf)

Sections: Session Start → Triage → Refinement → Planning → Execution → Quality Gate → Completion, plus reference cards for DOR, FIPD, Agent Routing, and File Index.

### Tools

**[temujira](../temujira/)** — Markdown-native Kanban pipeline dashboard.

```
Repo:    D:\Temp\git\temujira\
Start:   python D:\Temp\git\temujira\dashboard.py [--port 8500] [--root D:\Temp\git]
Open:    http://localhost:8500
Docs:    D:\Temp\git\temujira\README.md
```

Features:
- Auto-discovers all projects under `--root` that contain pipeline markdown files
- 6 Kanban columns: Inbox --> Ideation --> Refining --> Ready --> Queue --> Done
- **Project filter** buttons -- scope to a single project
- **Epic accordion** -- items grouped by epic prefix, collapse/expand persisted in localStorage
- **Promote -->** button moves items to the next pipeline stage (writes to .md files)
- **Lane-aware command shortcuts** -- purple `/sc:` buttons per card, copies to clipboard
- **Details** toggle expands card to show full item body

### Per-Project (synced copies)

```
{project}/
├── governance/             ← Synced from Governance repo
│   ├── CLAUDE-LOOP.md
│   ├── ORCHESTRATOR.md
│   ├── AGENT_CAPABILITIES.md
│   ├── DOD.md
│   ├── DOR.md
│   ├── KNOWN_PATTERNS.md
│   └── ROADMAP.md
├── BACKLOG.md              ← Project-scoped (NOT synced)
├── TODO-Today.md           ← Execution queue
├── DONE-Today.md           ← Completion log
├── INBOX.md                ← Raw input queue
├── .autopilot              ← Semaphore (run/pause)
├── .claude-action          ← Current action / status
├── .claude-activity        ← Activity heartbeat
└── done/
    └── DONE-2026-W{NN}.md  ← Weekly archives
```

### Sync Pipeline (as of 2026-03-09)

**4 destinations** via `scripts/sync-repos.ps1` (triggered by post-commit hook or manually):

| # | Destination | What | How |
|---|-------------|------|-----|
| 1 | **Local repos** | Copies 9 governance files into `governance/` subfolder | File copy (MD5 hash-check) |
| 2 | **Public repos** | Copies + commits + pushes to agentflow & agentflow-demo | git pull/add/commit/push |
| 3 | **Excel** | BACKLOG + ROADMAP as `.xlsx` workbook | COM automation |
| 4 | **Google Sheets** | Structured data via Tether HTTP API | AppScript bridge |

**Synced files (9):** CLAUDE-LOOP.md, DOR.md, DOD.md, KNOWN_PATTERNS.md, BACKLOG.md, ROADMAP.md, ORCHESTRATOR.md, AGENT_CAPABILITIES.md, GOVERNANCE-GUIDE.md

**Flags:** `-SkipRepos`, `-SkipPublish` (copy only, no commit/push), `-SkipExcel`, `-SkipSheets`, `-Quiet`

```
Governance ──→ ProjectA/governance/      [synced]
           ──→ Tether/governance/        [synced]
           ──→ ProjectB/governance/      [synced]
           ──→ ProjectC/governance/      [synced]
           ──→ ProjectD/governance/      [synced]
```

---

## 9. Worked Examples

### Example A: Bug Fix (fast track)

```
User: "The data export crashes when the dataset is empty"

1. TRIAGE
   ├── Classify: [bug]
   ├── Severity: blocks development → [hotfix]
   └── Write to TODO-Today.md (skips BACKLOG):
       - [ ] **fix** Data export crash on empty dataset `@claude` `stall:0`
         `/sc:implement "fix empty dataset crash" --focus backend`
         _Context: export_service.py -- confidence:1.0_

2. ROUTE
   ├── Only @claude is active → assign @claude, confidence: 1.0
   └── Bug DOR-lite: root cause = missing guard, fix = 1 step, test = test_export

3. EXECUTE
   ├── Read export_service.py
   ├── Add guard: if not dataset: return empty result
   ├── Write test_export_empty.py
   └── Run greenlight

4. CLEANUP SUB-LOOP
   ├── Greenlight: 0 findings → pass
   └── Continue

5. COMMIT + DONE
   ├── git commit -m "fix: guard against empty dataset in export"
   ├── queue done --task "Data export crash on empty dataset"
   └── Update KNOWN_PATTERNS if pattern is reusable
```

### Example B: Feature (full lifecycle)

```
User: "We need recipe categories to support 3-level nesting"

1. TRIAGE → INBOX.md → BACKLOG.md#Ideation
   └── "Recipe category 3-level self-join"

2. GRADUATION: Ideation → Refining
   ├── /sc:brainstorm "recipe category nesting" --depth deep
   └── Output: requirements/REQ_RECIPE_NESTING.md

3. GRADUATION: Refining → Ready
   ├── /sc:spec-panel requirements/REQ_RECIPE_NESTING.md --mode critique
   ├── Score: 7.2/10 → passes DOR
   └── Move to BACKLOG.md#Ready with priority #3

4. GRADUATION: Ready → Queued
   ├── /sc:workflow requirements/REQ_RECIPE_NESTING.md --strategy systematic
   └── Generates 6 queue items in TODO-Today.md:
       - [ ] **implement** US-RN-01 model + migration
       - [ ] **implement** US-RN-02 service layer
       - [ ] **implement** US-RN-03 API endpoints
       - [ ] **test** US-RN-01/02/03
       - [ ] **analyze** quality tail
       - [ ] **commit+deploy** quality tail

5. AUTOPILOT picks up queue, ROUTE assigns @claude to each
6. Execute → Cleanup → Commit → Done (for each item)
7. Completion cascade: check if this unblocks anything in BACKLOG
```

### Example C: Research Task (future multi-agent)

```
User: "Research marketplace SEO trends for product listings"

1. TRIAGE → BACKLOG.md#Ideation → [research]

2. ROUTE (when @gemini is active)
   ├── Score @claude:  -2 (no web browsing match)
   ├── Score @gemini:   6 (research + SEO + trends + web)
   ├── Score @chatgpt:  4 (marketplace + listings + web)
   └── Route: @gemini, confidence: 0.75

3. DISPATCH via Tether
   ├── tether_send(to="gemini", subject="research-task", text="...")
   └── Wait for tether_send(to="orchestrator", subject="task-complete", ...)

4. VALIDATE result
   └── Human reviews Gemini's research output before it enters the pipeline
```

---

## 10. Dictionary

| Term | Definition |
|------|-----------|
| **Autopilot** | The inner loop executor. Reads `.autopilot` semaphore, picks next `- [ ]` item, runs it. Dumb by design — orchestrator handles routing. |
| **BACKLOG** | The prioritized list of work. Three sections: Ideation (raw ideas), Refining (specs in progress), Ready (approved for queue). Cross-project backlog in Governance repo outranks project-local. |
| **BV Score** | Business Value score: Revenue (L/M/H) x User Reach (L/M/H) x Strategic Alignment (L/M/H). Max 9. Used for initiative prioritization. |
| **Completion Cascade** | After a task completes, the orchestrator checks if it unblocks any `needs:` dependencies in BACKLOG and suggests queuing them. |
| **Confidence** | Routing confidence score (0.0-1.0). How certain the orchestrator is about the agent assignment. <0.3 = unrouted. |
| **Context Preloading** | The orchestrator assembles file refs, risk flags, Tether threads, and prior art into the `_Context:_` line before execution. |
| **Critical Path** | Items in BACKLOG locked in sequence. Cannot be deprioritized relative to each other. `/workflow` must respect this order. |
| **Cleanup Sub-Loop** | Runs after every implementation, before every commit. Greenlight → fix Low → pause on Medium+. |
| **DOD** | Definition of Done. Exit gate. Must pass before deployment. Code quality + architecture + committed + deployable + pipeline housekeeping. |
| **DOR** | Definition of Ready. Entry gate. Must pass before implementation begins. US + AC + spec + score >= 7.0 + architecture + deps + tests + constraints + size. |
| **DOR-lite** | Lightweight gate for bugs/hotfixes. Root cause + fix plan + regression test + constraints + estimate. |
| **DONE-Today** | Completion log with timestamps. Auto-archives to `done/DONE-{YYYY}-W{WW}.md` at 200 lines. |
| **Graduation** | Moving an item from one pipeline stage to the next. Each graduation has a gate command. |
| **Greenlight** | Project-specific test/quality suite. Must be 100% green before any commit. |
| **Hotfix** | A bug that actively blocks development. Fast-tracks from INBOX directly to TODO-Today (skips Ideation/Refining). Requires Bug DOR-lite. |
| **INBOX** | Raw input queue. Anything the user sends (without `/q` prefix) lands here first. Triaged into BACKLOG. |
| **Inner Loop** | Autopilot execution cycle: semaphore check → read task → route → DOR → execute → cleanup → commit → done → loop. |
| **FIPD** | Finding taxonomy: Fix / Investigate / Plan / Decide. Every pattern and finding in KNOWN_PATTERNS is classified by action type. Investigate and Decide findings require an `Unknown:` clause declaring what remains unverified. |
| **KNOWN_PATTERNS** | Anti-pattern registry with FIPD action classification. Must be consulted before writing new code. Re-introducing a known pattern is a quality regression. |
| **LC-B** | Latent Canonical Binary. Tether's encoding format. 9 tags (NULL through OBJ_END). Never read with raw SQL. |
| **Orchestrator** | Lightweight routing layer. A phase inside autopilot, not a daemon. Assigns `@agent`, detects stalls, cascades completions. See ORCHESTRATOR.md. |
| **Outer Loop** | Human-driven queue lifecycle. User/planning populates TODO-Today via `/workflow`. |
| **Planning Round** | Triggered when queue is near-empty, 5+ Ready items idle, critical path changed, or retro completed. Scans INBOX, checks staleness, reviews risks, updates priorities, runs `/workflow`. |
| **Quality Tail** | Mandatory last items in every queue batch: `/sc:analyze` → `/sc:cleanup` → `/commit-smart` → deploy. |
| **Queue-first invariant** | Never implement during triage. Sequence: triage → write queue item → STOP. Autopilot picks it up. |
| **Retro** | Retrospective triggered every 10 completed User Stories. Reviews workflow friction, bug quality, memory gaps, loop robustness, tooling, quality gates. |
| **ROADMAP** | Strategic initiatives with BV scores. Cross-project. Do not implement without instruction. |
| **ROUTE** | The orchestrator phase. Step 3 in the inner loop. Assigns `@agent` via capability scoring. |
| **Routing Weight** | Base multiplier (0.0-1.0) per agent. 0.0 = stub (never routed). 1.0 = fully active. |
| **Semaphore** | `.autopilot` file. Contents: `run` or `pause`. Checked before every task. |
| **Stall** | A task that isn't making progress. Detected by time (no file changes), error loops (3+ same error), or explicit `STALLED:` signal. Escalation: warn → action warning → pause. |
| **Stall Counter** | `stall:N` tag on TODO-Today items. Incremented by supervisor on each check with no progress. Resets on any progress. |
| **Supervisor** | `autopilot-supervisor.ps1`. Process-level watchdog: stall detection, health heartbeat, crash recovery, log rotation, resource guard, queue complete detection. |
| **Tether** | LLM-to-LLM message bus. SQLite + BLAKE3 + LC-B. 13 MCP tools. HTTP API on port 7890. Google Sheets bridge for non-MCP agents. |
| **TODO-Today** | Living execution queue. Flat checkbox list. First unchecked = next task. Format: checkbox + bold phase + `/sc:` command + context. |
| **/q prefix** | Question-only signal. Messages starting with `/q` are answered conversationally — no triage, no queue items created. |
| **/workflow** | Skill that converts Ready BACKLOG items into TODO-Today queue items. Respects `#N` priority and Critical Path order. |

---

## 11. Quick Reference Card

### Commands

| Command | What it does |
|---------|-------------|
| `/triage` | Classify input → write to BACKLOG |
| `/workflow` | Ready items → TODO-Today queue |
| `/autopilot` | Start autonomous execution loop |
| `/sc:brainstorm` | Ideation → Refining graduation |
| `/requirements-clarity` | Catch ambiguous requirements (before spec-panel) |
| `/sc:spec-panel` | Refining → Ready graduation (gate: >= 7.0) |
| `/sc:implement` | Execute implementation task |
| `/requesting-code-review` | Self-review changed files (between verify and cleanup) |
| `/receiving-code-review` | Evaluate and apply review feedback |
| `/sc:analyze` | Quality audit (part of quality tail) |
| `/production-code-audit` | Deep security/perf/arch audit (M+ tasks, optional) |
| `/sc:cleanup` | Fix findings (part of quality tail, enforces `/clean-code`) |
| `/commit-smart` | Smart commit (part of quality tail) |
| `/finishing-a-development-branch` | PR creation + branch cleanup (if on feature branch) |
| `/kaizen` | Continuous improvement retro (every 10 stories) |
| `queue done --task "..."` | Move completed item to DONE-Today |
| `queue archive` | Archive DONE-Today to weekly file |

### Files to Check

| When | Check |
|------|-------|
| Session start | INBOX.md, BACKLOG.md#Ready, TODO-Today.md |
| Before coding | KNOWN_PATTERNS.md, CLAUDE.md constraints |
| After coding | Greenlight, DOD checklist |
| After bug fix | KNOWN_PATTERNS.md (add pattern), QUALITY_AUDIT.md (add finding) |
| After 10 stories | Retro trigger (counter in MEMORY.md) |

### Semaphore States

| `.autopilot` | Meaning |
|-------------|---------|
| `run` | Autopilot active — proceed with next task |
| `pause` | Autopilot stopped — human intervention needed |
| _(missing)_ | Treated as `pause` |

### Stall Levels

| Level | Action |
|-------|--------|
| `stall:0` | Normal — no issues |
| `stall:1` | Warning logged |
| `stall:2` | `.claude-action` warning written |
| `stall:3` | Autopilot paused + toast + escalate to human |

---

## 12. Support Processes — Skill Portfolios

Skills outside the dev loop are organized into **4 support processes**. Each has its own trigger, cadence, and skill portfolio. These run parallel to the inner loop — never inside it.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE SKILL PORTFOLIOS                          │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  DEV LOOP       │  │  SUPPORT         │  │  ON-DEMAND           │   │
│  │  (inner loop)   │  │  PROCESSES       │  │  TOOLBOX             │   │
│  │                 │  │                  │  │                      │   │
│  │  /sc:implement  │  │  GTM Pipeline    │  │  /figma              │   │
│  │  /sc:analyze    │  │  SEO Engine      │  │  /imagegen           │   │
│  │  /sc:cleanup    │  │  Intel Radar     │  │  /canvas-design      │   │
│  │  /commit-smart  │  │  Content Desk    │  │  /excalidraw-diagram │   │
│  │  ...            │  │                  │  │  /gitnexus           │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│           │                    │                        │               │
│           └────────────────────┼────────────────────────┘               │
│                                │                                        │
│                     All feed back into BACKLOG                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### SP-1: Go-to-Market Pipeline

**Trigger:** Feature ships to production, product launch planned, or listing refresh needed.
**Cadence:** Per-release or quarterly review.
**Owner:** User-initiated (never autopilot).

```
/marketing-strategy-pmm        → positioning + ICP + messaging
/launch-strategy               → launch plan + timeline
/executing-marketing-campaigns → campaign execution across channels
/copywriting                   → landing page / listing copy
/copy-editing                  → polish existing copy
/social-content                → social media assets
/marketing-ideas               → brainstorm campaign ideas
```

**Workflow:**
1. Feature completes in dev loop → user triggers GTM
2. `/marketing-strategy-pmm` produces positioning doc
3. `/launch-strategy` produces launch plan
4. Remaining skills execute the plan
5. Findings feed back into BACKLOG.md#Ideation

### SP-2: SEO & Discovery Engine

**Trigger:** New pages/listings published, quarterly audit cycle, or traffic drop detected.
**Cadence:** Monthly audit + per-listing optimization.
**Owner:** User-initiated or scheduled.

```
/seo-audit                     → technical SEO health check
/seo-optimizer                 → content + keyword optimization
/programmatic-seo              → template-driven page generation at scale
/schema-markup                 → structured data implementation
/analytics-tracking            → event tracking setup + verification
/google-analytics              → traffic analysis + insights
/roier-seo                     → Lighthouse/PageSpeed audit + fixes
```

**Workflow:**
1. `/seo-audit` produces findings report
2. Findings → BACKLOG.md#Ideation (technical fixes go to dev loop)
3. `/seo-optimizer` + `/schema-markup` applied to content
4. `/analytics-tracking` verifies measurement
5. `/google-analytics` monitors results

### SP-3: Competitive Intelligence Radar

**Trigger:** Planning round (PO-05), roadmap review, or new competitor detected.
**Cadence:** Per planning round or quarterly.
**Owner:** Feeds into planning rounds.

```
/competitor-alternatives        → competitor comparison pages
/pricing-strategy              → pricing model analysis
/free-tool-strategy            → free tool as marketing lever
/app-store-optimization        → marketplace listing optimization
/x-twitter-scraper             → social signal monitoring
```

**Workflow:**
1. Planning round triggers intel scan
2. `/competitor-alternatives` maps competitive landscape
3. `/pricing-strategy` reviews positioning
4. Findings feed into ROADMAP.md BV scoring and BACKLOG.md prioritization

### SP-4: Content Production Desk

**Trigger:** Marketplace listing creation, blog/docs needed, or content calendar milestone.
**Cadence:** Per-listing or weekly content batch.
**Owner:** User-initiated.

```
/content-creator               → SEO-optimized marketing content
/content-research-writer       → research-backed articles with citations
/viral-generator-builder       → shareable tool builders
/shopify-development           → Shopify integration
```

**Workflow:**
1. User identifies content need
2. `/content-research-writer` produces draft
3. `/content-creator` optimizes for SEO
4. `/copy-editing` polishes final version

### SP-5: Lightsout Hygiene

**Trigger:** Queue empty (autopilot end-of-day), planning round, or on-demand.
**Cadence:** Daily (if autopilot active) or weekly minimum.
**Owner:** Autopilot-triggered or user-initiated.

```
/health                        → pipeline staleness + velocity snapshot
/backlog-grooming              → archive shipped items, flag stale/orphans, cleanup fixes
/session-handoff               → save context for next session
```

**Workflow:**
1. Queue drains (step 14 of inner loop) → lightsout chain fires automatically
2. `/health` produces read-only pipeline snapshot
3. `/backlog-grooming` archives shipped items, flags stale/orphans, applies cleanup fixes
4. `/session-handoff` captures session context

**Key behaviors:**
- Idempotent — running twice produces no additional changes
- `--dry-run` available for scan-only mode (no file modifications)
- Never modifies active items or priorities — only touches shipped/resolved items
- Stale/orphan findings surfaced for human decision in next session

### On-Demand Toolbox (no process — invoke directly)

These skills are context-triggered during dev work. No formal process needed.

| Skill | When to invoke |
|-------|---------------|
| `/figma` | Translating Figma designs into code |
| `/frontend-design` | Building production-grade UI |
| `/canvas-design` | Creating visual artifacts (PNG/PDF) |
| `/imagegen` | Generating or editing images via OpenAI |
| `/excalidraw-diagram` | Visualizing workflows or architecture |
| `/algorithmic-art` | Creating generative art with p5.js |
| `/theme-factory` | Styling artifacts with themed templates |
| `/gitnexus` | Codebase exploration via graph index |
| `/git-context-controller` | Managing agent memory as versioned files |
| `/git-pushing` | Safe push with pre-flight checks |
| `/using-git-worktrees` | Isolated feature work in worktrees |
