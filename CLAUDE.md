# CLAUDE.md — agentflow-demo

Minimal FastAPI task manager for demonstrating [agentflow](https://github.com/cordsjon/agentflow) governance loops.

## Tech Stack

Python 3.11+ · FastAPI · SQLModel/SQLite · Uvicorn

## Constraints

- **Service-first:** Business logic in `TaskService`, not route handlers
- **No new packages** without explicit instruction
- **Port 8000** for development

## Governance

This project follows the agentflow loop. See `governance/CLAUDE-LOOP.md` for the execution model.

### Pipeline Files
- `INBOX.md` — raw input queue
- `BACKLOG.md` — Ideation / Refining / Ready stages
- `TODO-Today.md` — execution queue
- `DONE-Today.md` — completion log
- `.autopilot` — semaphore (run/pause)

### Rules
1. Everything is loop input by default (unless `/q` prefixed)
2. Queue-first: triage → write queue item → STOP (never implement during triage)
3. No commit without tests passing
4. Every bug fix updates KNOWN_PATTERNS if a repeatable pattern emerged

## Verification

```bash
python -m pytest tests/ -v
```

## Reference

- [agentflow](https://github.com/cordsjon/agentflow) — governance framework
- [Tether](https://github.com/latentcollapse/Tether) — LLM-to-LLM message bus (optional)

## Philosophy
There are no solutions, only trade-offs.
