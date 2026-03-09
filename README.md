# agentflow-demo

**Demo repository for [agentflow](https://github.com/cordsjon/agentflow)** — a boilerplate FastAPI app with pre-filled pipeline stages for recording workflow demos.

## What's Inside

A minimal task management API with realistic pipeline state at every stage — INBOX items waiting for triage, BACKLOG items in Ideation/Refining/Ready, a TODO-Today queue mid-execution, and completed items in DONE-Today.

Use this repo to:
- **Record demo videos** of the agentflow loop in action
- **Test governance tooling** (Remote Control, Pipeline Dashboard) against real pipeline state
- **Onboard new users** with a working example they can run immediately

## Quick Start

```bash
# 1. Clone
git clone https://github.com/cordsjon/agentflow-demo.git
cd agentflow-demo

# 2. Set up
python -m venv .venv
.venv/Scripts/activate     # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# 3. Run
python -m uvicorn app.main:app --reload --port 8000

# 4. Open
# API docs:  http://localhost:8000/docs
# Health:    http://localhost:8000/api/health
```

## Pipeline State (pre-filled for demos)

| File | Items | Demo Purpose |
|------|-------|-------------|
| `INBOX.md` | 4 raw items | Show triage flow (classify → BACKLOG) |
| `BACKLOG.md` | 9 items across 3 stages | Show graduation (Ideation → Refining → Ready) |
| `TODO-Today.md` | 6 queue items (2 done, 1 current, 3 pending) | Show autopilot execution mid-flight |
| `DONE-Today.md` | 5 completed items with timestamps | Show completion log + archive trigger |
| `.autopilot` | `run` | Autopilot is active |

## Demo Sequences

### Sequence 1: Triage (INBOX → BACKLOG)
1. Open `INBOX.md` — 4 untriaged items
2. Run `/triage` — classify each item
3. Watch items move to `BACKLOG.md` appropriate stages

### Sequence 2: Graduation (BACKLOG → Ready)
1. Show BACKLOG with items in Ideation, Refining, Ready
2. Run `/sc:brainstorm` on an Ideation item → moves to Refining
3. Run `/requirements-clarity` + `/sc:spec-panel` → score >= 7.0 → moves to Ready

### Sequence 3: Queue Execution (autopilot loop)
1. Show `TODO-Today.md` with 4 unchecked items
2. Start `/autopilot` — agent picks first unchecked
3. Watch the 14-step inner loop: TDD → implement → verify → review → cleanup → commit
4. Item gets checked, next item picked up

### Sequence 4: Quality Gate (cleanup sub-loop)
1. Implementation completes
2. `/sc:analyze` runs — finds 2 Low, 1 Medium issue
3. Low issues auto-fixed in cleanup loop
4. Medium issue → autopilot pauses → human review

### Sequence 5: Planning Round
1. Queue nearly empty (1 item left)
2. System suggests planning round
3. Scan INBOX, check staleness, review risks
4. `/sc:workflow` generates new queue from Ready items

## Project Structure

```
agentflow-demo/
├── app/
│   ├── main.py              # FastAPI app + routes
│   ├── models.py            # SQLModel entities (Task, Tag)
│   ├── services.py          # Business logic (service-first pattern)
│   └── templates/
│       └── index.html       # Minimal UI
├── tests/
│   └── test_tasks.py        # Example test file
├── governance/              # ← Synced from agentflow
│   ├── CLAUDE-LOOP.md
│   ├── DOD.md
│   ├── DOR.md
│   └── ...
├── INBOX.md                 # Pre-filled: 4 raw items
├── BACKLOG.md               # Pre-filled: 9 items (3 stages)
├── TODO-Today.md            # Pre-filled: 6 items (mid-execution)
├── DONE-Today.md            # Pre-filled: 5 completed items
├── .autopilot               # Semaphore: "run"
├── CLAUDE.md                # Agent instructions
├── requirements.txt
└── README.md
```

## Governance

This demo uses [agentflow](https://github.com/cordsjon/agentflow) governance. The `governance/` directory is synced from the agentflow repo.

## License

MIT — see [LICENSE](LICENSE).
