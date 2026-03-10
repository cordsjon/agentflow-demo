# Definition of Done (DOD)

**Gate:** Must pass BEFORE deployment.
An item that fails DOD cannot be deployed. The queue tail enforces this automatically.

## Checklist

### Code Quality
- [ ] **All new code has tests** — every US has a corresponding test file
- [ ] **Tests pass** — project's greenlight/test suite 100% green
- [ ] **No new test failures** — pre-existing failures documented, zero regressions
- [ ] **Quality audit clean** — `/sc:analyze --focus quality` returns only Low findings (or none). All findings classified using [FIPD taxonomy](KNOWN_PATTERNS.md#fipd-finding-taxonomy) (Fix/Investigate/Plan/Decide) instead of severity-only. Investigate/Decide findings must include an `Unknown:` clause.
- [ ] **Low findings fixed** — `/sc:cleanup --type all` applied and verified

### Architecture
- [ ] **Service-first** — business logic in service layer, not route handlers
- [ ] **No constraint violations** — checked against project's CLAUDE.md
- [ ] **Backward compatible** — or all callers updated

### External Writes
- [ ] **Dry-run before mutation** — any skill that writes to files outside the current task scope (BACKLOG.md, ROADMAP.md, external systems) MUST preview changes before executing. Skills log intended writes to `.claude-action` before applying them. Autopilot: always dry-run external writes first, then execute.

### Committed
- [ ] **Clean commit** — descriptive message, atomic scope
- [ ] **No uncommitted changes** — `git status` clean after commit
- [ ] **No secrets** — no credentials, API keys, or tokens in committed code
- [ ] **Pre-commit hooks pass** — all configured hooks green

### Deployable
- [ ] **Application starts** — server responds, no crash on boot
- [ ] **Existing functionality intact** — no regressions

### Verification
- [ ] **Verification pass** — `/verification-before-completion` run with evidence (test output, screenshots) before marking task done

### Pipeline Housekeeping
- [ ] **Queue item checked** — `[x]` in TODO-Today.md
- [ ] **DONE-Today updated** — item moved with timestamp
- [ ] **BACKLOG updated** — source item marked completed or removed

## Enforcement (Mandatory Queue Tail)

```
1. /sc:analyze "<changed files>" --focus quality    (findings use FIPD classification)
2. /production-code-audit       (M+ size tasks only — deep security/perf/arch)
3. /sc:cleanup --type all
4. /sc:test --coverage          (if new test files)
5. /commit-smart
6. deploy                       (project-specific)
```

> **FIPD reference:** All finding outputs use Fix/Investigate/Plan/Decide classification.
> Definitions and uncertainty declaration rules: [KNOWN_PATTERNS.md](KNOWN_PATTERNS.md#fipd-finding-taxonomy)

If any step fails, autopilot pauses and reports the blocker.
