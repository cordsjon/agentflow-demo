# TODO-Today

> **>>> NEXT**

## Queue

- [x] **Implement: US-DM-06 Project structure + FastAPI scaffold**
  `/sc:implement "FastAPI project with SQLModel, health endpoint, task CRUD"`
  _Context: app/main.py, app/models.py, app/services.py_

- [x] **Implement: US-DM-07 Seed data + index page**
  `/sc:implement "seed demo tasks on first run, minimal HTML dashboard"`
  _Context: app/main.py _seed(), app/templates/index.html_

- [ ] **Implement: US-DM-01 Priority sorting in UI**
  `/test-driven-development`
  `/sc:implement "sort tasks by priority, add drag-to-reorder"`
  _Context: BACKLOG.md#Ready US-DM-01, app/services.py TaskService.list_tasks_

- [ ] **Test: Write test suite for task CRUD**
  `/test-driven-development`
  _Context: tests/test_tasks.py — cover create, read, update, delete, list, filter_

- [ ] **Implement: US-DM-05 Health endpoint resilience**
  `/sc:implement "health returns 503 on DB failure, add uptime + version"`
  _Context: BACKLOG.md#Ready US-DM-05, app/main.py health()_

- [ ] **Quality: Cleanup + commit**
  `/sc:analyze "app/" --focus quality`
  `/sc:cleanup --type all`
  `/commit-smart`
