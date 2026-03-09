"""Domain models — SQLModel entities + Pydantic schemas."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=50, unique=True)


class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="")
    status: str = Field(default="todo")  # todo | in_progress | done
    priority: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TaskCreate(SQLModel):
    title: str = Field(max_length=200)
    description: str = ""
    priority: int = Field(default=0, ge=0)


class TaskRead(SQLModel):
    id: int
    title: str
    description: str
    status: str
    priority: int
    created_at: datetime
    updated_at: datetime


class TaskUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: int | None = Field(default=None, ge=0)
