"""Service layer — business logic lives here, not in route handlers."""

import os
import re
from datetime import UTC, datetime
from pathlib import Path

from sqlmodel import Session, select

from app.models import (
    BacklogState,
    DoneEntry,
    GovernanceState,
    Tag,
    Task,
    TaskCreate,
    TaskTag,
    TaskUpdate,
    TodoItem,
    TodoState,
)


class GovernanceService:
    """Read-only service parsing governance markdown files into structured state."""

    def __init__(self, base_path: str = "."):
        self._base = Path(base_path)

    def get_state(self) -> GovernanceState:
        return GovernanceState(
            inbox_count=self._parse_inbox(),
            backlog=self._parse_backlog(),
            todo=self._parse_todo(),
            done=self._parse_done(),
            autopilot=self._read_autopilot(),
        )

    def _read_file(self, name: str) -> str:
        """Read a file, returning empty string if missing or broken symlink."""
        try:
            return (self._base / name).read_text(encoding="utf-8")
        except (FileNotFoundError, OSError):
            return ""

    def _parse_inbox(self) -> int:
        content = self._read_file("INBOX.md")
        return len(re.findall(r"^- ", content, re.MULTILINE))

    def _parse_backlog(self) -> BacklogState:
        content = self._read_file("BACKLOG.md")
        if not content:
            return BacklogState()

        # Extract only the "# Agentflow Demo" section
        match = re.search(
            r"^# Agentflow Demo\s*\n(.*?)(?=^# |\Z)",
            content,
            re.MULTILINE | re.DOTALL,
        )
        if not match:
            return BacklogState()

        section = match.group(1)
        stages = {"ideation": 0, "refining": 0, "ready": 0, "done": 0}

        current_stage = None
        for line in section.split("\n"):
            stage_match = re.match(r"^## (\w+)", line)
            if stage_match:
                name = stage_match.group(1).lower()
                current_stage = name if name in stages else None
                continue
            if current_stage and re.match(r"^- ", line):
                stages[current_stage] += 1

        return BacklogState(**stages)

    def _parse_todo(self) -> TodoState:
        content = self._read_file("TODO-Today.md")
        if not content:
            return TodoState()

        # Try to find Agentflow Demo section
        match = re.search(
            r"^# Agentflow Demo\s*\n(.*?)(?=^# |\Z)",
            content,
            re.MULTILINE | re.DOTALL,
        )
        text = match.group(1) if match else content

        items = []
        for m in re.finditer(r"^- \[([ x])\] (.+)$", text, re.MULTILINE):
            items.append(TodoItem(text=m.group(2).strip(), checked=m.group(1) == "x"))

        checked = sum(1 for i in items if i.checked)
        return TodoState(
            total=len(items),
            checked=checked,
            unchecked=len(items) - checked,
            items=items,
        )

    def _parse_done(self) -> list[DoneEntry]:
        content = self._read_file("DONE-Today.md")
        if not content:
            return []

        entries = []
        current_date = ""
        current_title = ""
        current_details: list[str] = []

        for line in content.split("\n"):
            date_match = re.match(r"^## (\d{4}-\d{2}-\d{2})\s*[—–-]?\s*(.*)", line)
            if date_match:
                if current_date and current_title:
                    entries.append(DoneEntry(
                        date=current_date,
                        title=current_title,
                        details="\n".join(current_details).strip(),
                    ))
                current_date = date_match.group(1)
                current_title = date_match.group(2).strip() or "Completed work"
                current_details = []
                continue
            if current_date and line.strip():
                current_details.append(line.strip())

        if current_date and current_title:
            entries.append(DoneEntry(
                date=current_date,
                title=current_title,
                details="\n".join(current_details).strip(),
            ))

        return entries[:10]  # Most recent entries (file is chronological)

    def _read_autopilot(self) -> str:
        content = self._read_file(".autopilot").strip().lower()
        if content in ("run", "pause"):
            return content
        return "stopped"


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
