"""Service layer — business logic lives here, not in route handlers."""

from datetime import UTC, datetime

from sqlmodel import Session, select

from app.models import Tag, Task, TaskCreate, TaskTag, TaskUpdate


class TagService:
    """Tag CRUD operations following service-first pattern."""

    def __init__(self, session: Session):
        self._session = session

    def list_tags(self) -> list[Tag]:
        return list(self._session.exec(select(Tag).order_by(Tag.name)).all())

    def get_tag(self, tag_id: int) -> Tag | None:
        return self._session.get(Tag, tag_id)

    def create_tag(self, name: str) -> Tag:
        existing = self._session.exec(select(Tag).where(Tag.name == name)).first()
        if existing:
            raise ValueError(f"Tag '{name}' already exists")
        tag = Tag(name=name)
        self._session.add(tag)
        self._session.commit()
        self._session.refresh(tag)
        return tag

    def delete_tag(self, tag_id: int) -> bool:
        tag = self._session.get(Tag, tag_id)
        if not tag:
            return False
        # Remove junction rows first (SQLite may not enforce FK cascades)
        task_tags = self._session.exec(
            select(TaskTag).where(TaskTag.tag_id == tag_id)
        ).all()
        for tt in task_tags:
            self._session.delete(tt)
        self._session.delete(tag)
        self._session.commit()
        return True


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
        tag: str | None = None,
    ) -> list[Task]:
        col = sort_by if sort_by in self.SORTABLE_COLUMNS else "priority"
        order_col = getattr(Task, col)
        if sort_dir == "desc":
            order_col = order_col.desc()
        stmt = select(Task).order_by(order_col)
        if status:
            stmt = stmt.where(Task.status == status)
        if tag:
            stmt = (
                stmt.join(TaskTag, TaskTag.task_id == Task.id)
                .join(Tag, Tag.id == TaskTag.tag_id)
                .where(Tag.name == tag)
            )
        return list(self._session.exec(stmt.limit(limit)).all())

    def get_task(self, task_id: int) -> Task | None:
        return self._session.get(Task, task_id)

    def create_task(self, data: TaskCreate) -> Task:
        task = Task(
            title=data.title,
            description=data.description,
            priority=data.priority,
        )
        self._session.add(task)
        self._session.commit()
        self._session.refresh(task)
        self._assign_tags(task.id, data.tag_ids)
        self._session.refresh(task)
        return task

    def update_task(self, task_id: int, data: TaskUpdate) -> Task | None:
        task = self._session.get(Task, task_id)
        if not task:
            return None
        update_data = data.model_dump(exclude_unset=True)
        tag_ids = update_data.pop("tag_ids", None)
        for key, val in update_data.items():
            setattr(task, key, val)
        task.updated_at = datetime.now(UTC)
        self._session.add(task)
        self._session.commit()
        if tag_ids is not None:
            # Set-replace: delete existing, add new
            existing = self._session.exec(
                select(TaskTag).where(TaskTag.task_id == task_id)
            ).all()
            for tt in existing:
                self._session.delete(tt)
            self._session.commit()
            self._assign_tags(task_id, tag_ids)
        self._session.refresh(task)
        return task

    def delete_task(self, task_id: int) -> bool:
        task = self._session.get(Task, task_id)
        if not task:
            return False
        # Remove junction rows first
        task_tags = self._session.exec(
            select(TaskTag).where(TaskTag.task_id == task_id)
        ).all()
        for tt in task_tags:
            self._session.delete(tt)
        self._session.delete(task)
        self._session.commit()
        return True

    def _assign_tags(self, task_id: int, tag_ids: list[int]) -> None:
        """Create TaskTag rows for valid tag_ids. Skip invalid IDs silently."""
        for tid in tag_ids:
            tag = self._session.get(Tag, tid)
            if tag:
                tt = TaskTag(task_id=task_id, tag_id=tid)
                self._session.add(tt)
        self._session.commit()
