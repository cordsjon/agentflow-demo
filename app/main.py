"""agentflow-demo — minimal FastAPI task manager for governance demos."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import Task, TaskCreate, TaskRead, TaskUpdate, Tag
from app.services import TaskService

engine = create_engine("sqlite:///demo.db", echo=False)
app = FastAPI(title="agentflow-demo", version="0.1.0")


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


@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    status: str | None = None,
    sort_by: str = "priority",
    sort_dir: str = "asc",
    limit: int = 50,
    session: Session = Depends(get_db),
):
    svc = TaskService(session)
    return svc.list_tasks(
        status=status, sort_by=sort_by, sort_dir=sort_dir, limit=min(limit, 200)
    )


@app.post("/api/tasks", response_model=TaskRead, status_code=201)
def create_task(body: TaskCreate, session: Session = Depends(get_db)):
    svc = TaskService(session)
    return svc.create_task(body)


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_db)):
    svc = TaskService(session)
    task = svc.get_task(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@app.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, body: TaskUpdate, session: Session = Depends(get_db)):
    svc = TaskService(session)
    task = svc.update_task(task_id, body)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, session: Session = Depends(get_db)):
    svc = TaskService(session)
    if not svc.delete_task(task_id):
        raise HTTPException(404, "Task not found")


@app.get("/api/tags", response_model=list[str])
def list_tags(session: Session = Depends(get_db)):
    return [t.name for t in session.exec(select(Tag)).all()]


def _seed(session: Session):
    """Seed demo data on first run."""
    tags = [Tag(name=n) for n in ["bug", "feature", "refactor", "docs", "test"]]
    for t in tags:
        session.add(t)

    tasks = [
        Task(title="Set up project structure", status="done", priority=1),
        Task(title="Add health endpoint", status="done", priority=2),
        Task(title="Implement task CRUD", status="in_progress", priority=3),
        Task(title="Add tag filtering", status="todo", priority=4),
        Task(title="Write unit tests", status="todo", priority=5),
        Task(title="Add pagination", status="todo", priority=6),
    ]
    for t in tasks:
        session.add(t)

    session.commit()
