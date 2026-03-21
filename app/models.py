"""Domain models — SQLModel entities + Pydantic schemas."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    pass


class TaskTag(SQLModel, table=True):
    """Junction table linking Task ↔ Tag (many-to-many)."""

    id: int | None = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    tag_id: int = Field(foreign_key="tag.id", index=True)


class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True)

    tasks: list["Task"] = Relationship(back_populates="tags", link_model=TaskTag)


class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="")
    status: str = Field(default="todo")  # todo | in_progress | done
    priority: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    tags: list[Tag] = Relationship(back_populates="tasks", link_model=TaskTag)


class TagRead(SQLModel):
    id: int
    name: str


class TaskCreate(SQLModel):
    title: str = Field(max_length=200)
    description: str = ""
    priority: int = Field(default=0, ge=0)
    tag_ids: list[int] = []


class TaskRead(SQLModel):
    id: int
    title: str
    description: str
    status: str
    priority: int
    created_at: datetime
    updated_at: datetime
    tags: list[str] = []

    @classmethod
    def from_task(cls, task: Task) -> "TaskRead":
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            created_at=task.created_at,
            updated_at=task.updated_at,
            tags=[tag.name for tag in task.tags],
        )


class TaskUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: int | None = Field(default=None, ge=0)
    tag_ids: list[int] | None = None  # None = don't change, [] = clear all


# ── Governance schemas (response-only, no DB tables) ─────────────────────


class BacklogState(SQLModel):
    ideation: int = 0
    refining: int = 0
    ready: int = 0
    done: int = 0


class TodoItem(SQLModel):
    text: str
    checked: bool


class TodoState(SQLModel):
    total: int = 0
    checked: int = 0
    unchecked: int = 0
    items: list[TodoItem] = []


class DoneEntry(SQLModel):
    date: str
    title: str
    details: str = ""


class GovernanceState(SQLModel):
    """Snapshot of governance pipeline state, parsed from markdown files."""

    inbox_count: int = 0
    backlog: BacklogState = BacklogState()
    todo: TodoState = TodoState()
    done: list[DoneEntry] = []
    autopilot: str = "stopped"  # "run" | "pause" | "stopped"
