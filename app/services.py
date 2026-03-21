"""Service layer — business logic lives here, not in route handlers."""

from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Task, TaskCreate, TaskUpdate


class TaskService:
    """Task CRUD operations following service-first pattern."""

    def __init__(self, session: Session):
        self._session = session

    SORTABLE_COLUMNS = {"priority", "created_at", "title", "status"}

    def list_tasks(
        self,
        status: str | None = None,
        sort_by: str = "priority",
        sort_dir: str = "asc",
        limit: int = 50,
    ) -> list[Task]:
        col = sort_by if sort_by in self.SORTABLE_COLUMNS else "priority"
        order_col = getattr(Task, col)
        if sort_dir == "desc":
            order_col = order_col.desc()
        stmt = select(Task).order_by(order_col)
        if status:
            stmt = stmt.where(Task.status == status)
        return list(self._session.exec(stmt.limit(limit)).all())

    def get_task(self, task_id: int) -> Task | None:
        return self._session.get(Task, task_id)

    def create_task(self, data: TaskCreate) -> Task:
        task = Task(**data.model_dump())
        self._session.add(task)
        self._session.commit()
        self._session.refresh(task)
        return task

    def update_task(self, task_id: int, data: TaskUpdate) -> Task | None:
        task = self._session.get(Task, task_id)
        if not task:
            return None
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(task, key, val)
        task.updated_at = datetime.now(UTC)
        self._session.add(task)
        self._session.commit()
        self._session.refresh(task)
        return task

    def delete_task(self, task_id: int) -> bool:
        task = self._session.get(Task, task_id)
        if not task:
            return False
        self._session.delete(task)
        self._session.commit()
        return True
