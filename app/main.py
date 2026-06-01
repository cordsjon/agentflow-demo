"""agentflow-demo — minimal FastAPI task manager for governance demos."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import (
    GovernanceState,
    Tag,
    TagRead,
    Task,
    TaskCreate,
    TaskRead,
    TaskTag,
    TaskUpdate,
)
from app.services import GovernanceService, TagService, TaskService

engine = create_engine("sqlite:///demo.db", echo=False)
app = FastAPI(title="agentflow-demo", version="0.2.0")


def get_db():
    with Session(engine) as session:
        yield session


@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        if not session.exec(select(Task)).first():
            _seed(session)


@app.get("/", response_class=HTMLResponse)
def index():
    with open("app/templates/index.html") as f:
        return f.read()


@app.get("/api/health")
def health(session: Session = Depends(get_db)):
    try:
        count = len(session.exec(select(Task)).all())
        return {"status": "ok", "tasks": count}
    except Exception:
        return {"status": "degraded", "tasks": 0, "error": "database unavailable"}


# ── Task endpoints ───────────────────────────────────────────────────────


@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    status: str | None = None,
    tag: str | None = None,
    sort_by: str = "priority",
    sort_dir: str = "asc",
    limit: int = 50,
    session: Session = Depends(get_db),
):
    svc = TaskService(session)
    tasks = svc.list_tasks(
        status=status,
        tag=tag,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=min(limit, 200),
    )
    return [TaskRead.from_task(t) for t in tasks]


@app.post("/api/tasks", response_model=TaskRead, status_code=201)
def create_task(body: TaskCreate, session: Session = Depends(get_db)):
    svc = TaskService(session)
    task = svc.create_task(body)
    return TaskRead.from_task(task)


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_db)):
    svc = TaskService(session)
    task = svc.get_task(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return TaskRead.from_task(task)


@app.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, body: TaskUpdate, session: Session = Depends(get_db)):
    svc = TaskService(session)
    task = svc.update_task(task_id, body)
    if not task:
        raise HTTPException(404, "Task not found")
    return TaskRead.from_task(task)


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_db)):
    svc = TaskService(session)
    if not svc.delete_task(task_id):
        raise HTTPException(404, "Task not found")


# ── Tag endpoints ────────────────────────────────────────────────────────


@app.get("/api/tags", response_model=list[TagRead])
def list_tags(session: Session = Depends(get_db)):
    svc = TagService(session)
    return svc.list_tags()


@app.post("/api/tags", response_model=TagRead, status_code=201)
def create_tag(body: dict, session: Session = Depends(get_db)):
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(422, "Tag name is required")
    svc = TagService(session)
    try:
        return svc.create_tag(name)
    except ValueError:
        raise HTTPException(409, f"Tag '{name}' already exists")


@app.delete("/api/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: int, session: Session = Depends(get_db)):
    svc = TagService(session)
    if not svc.delete_tag(tag_id):
        raise HTTPException(404, "Tag not found")


# ── Governance endpoint ──────────────────────────────────────────────────


@app.get("/api/governance", response_model=GovernanceState)
def get_governance():
    svc = GovernanceService(base_path=".")
    return svc.get_state()


# ── Seed data ────────────────────────────────────────────────────────────


def _seed(session: Session):
    """Seed demo data on first run."""
    tags = {n: Tag(name=n) for n in ["bug", "feature", "refactor", "docs", "test"]}
    for t in tags.values():
        session.add(t)
    session.flush()  # ensure tag IDs are available

    tasks_data = [
        ("Set up project structure", "done", 1, ["refactor"]),
        ("Add health endpoint", "done", 2, ["feature"]),
        ("Implement task CRUD", "in_progress", 3, ["feature"]),
        ("Add tag filtering", "todo", 4, ["feature"]),
        ("Write unit tests", "todo", 5, ["test"]),
        ("Add pagination", "todo", 6, ["feature"]),
    ]
    for title, status, priority, tag_names in tasks_data:
        task = Task(title=title, status=status, priority=priority)
        session.add(task)
        session.flush()
        for tn in tag_names:
            session.add(TaskTag(task_id=task.id, tag_id=tags[tn].id))

    session.commit()
