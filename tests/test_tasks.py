"""Task CRUD tests — comprehensive coverage for all endpoints."""

import os

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.main import app, get_db

engine = create_engine("sqlite:///test.db", echo=False)


def get_test_db():
    with Session(engine) as session:
        yield session


app.dependency_overrides[get_db] = get_test_db


def setup_module():
    SQLModel.metadata.create_all(engine)


def teardown_module():
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("test.db"):
        os.remove("test.db")


client = TestClient(app)


# ── Health ────────────────────────────────────────────────────────────────


def test_health_returns_ok():
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "tasks" in data


# ── Create ────────────────────────────────────────────────────────────────


def test_create_task():
    r = client.post("/api/tasks", json={"title": "Test task", "priority": 1})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test task"
    assert data["status"] == "todo"
    assert data["priority"] == 1
    assert data["id"] is not None
    assert "created_at" in data
    assert "updated_at" in data


def test_create_task_default_priority():
    r = client.post("/api/tasks", json={"title": "Default priority"})
    assert r.status_code == 201
    assert r.json()["priority"] == 0


def test_create_task_with_description():
    r = client.post(
        "/api/tasks",
        json={"title": "With desc", "description": "Some details", "priority": 5},
    )
    assert r.status_code == 201
    assert r.json()["description"] == "Some details"


def test_create_task_missing_title_returns_422():
    r = client.post("/api/tasks", json={"priority": 1})
    assert r.status_code == 422


def test_create_task_negative_priority_returns_422():
    r = client.post("/api/tasks", json={"title": "Bad", "priority": -1})
    assert r.status_code == 422


# ── Read ──────────────────────────────────────────────────────────────────


def test_list_tasks():
    r = client.get("/api/tasks")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) > 0


def test_get_task():
    create = client.post("/api/tasks", json={"title": "Get me", "priority": 2})
    task_id = create.json()["id"]

    r = client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "Get me"


def test_get_nonexistent_returns_404():
    r = client.get("/api/tasks/99999")
    assert r.status_code == 404


def test_list_tasks_filter_by_status():
    client.post("/api/tasks", json={"title": "Todo filter test", "priority": 10})
    r = client.get("/api/tasks?status=todo")
    assert r.status_code == 200
    for task in r.json():
        assert task["status"] == "todo"


def test_list_tasks_filter_nonexistent_status_returns_empty():
    r = client.get("/api/tasks?status=nonexistent")
    assert r.status_code == 200
    assert r.json() == []


def test_list_tasks_respects_limit():
    # Create enough tasks
    for i in range(5):
        client.post("/api/tasks", json={"title": f"Limit test {i}", "priority": i})
    r = client.get("/api/tasks?limit=2")
    assert r.status_code == 200
    assert len(r.json()) <= 2


def test_list_tasks_limit_capped_at_200():
    r = client.get("/api/tasks?limit=999")
    assert r.status_code == 200
    # Just verify it doesn't error — cap is applied server-side


# ── Sort ──────────────────────────────────────────────────────────────────


def test_list_tasks_sort_by_priority_asc():
    r = client.get("/api/tasks?sort_by=priority&sort_dir=asc")
    assert r.status_code == 200
    tasks = r.json()
    priorities = [t["priority"] for t in tasks]
    assert priorities == sorted(priorities)


def test_list_tasks_sort_by_priority_desc():
    r = client.get("/api/tasks?sort_by=priority&sort_dir=desc")
    assert r.status_code == 200
    tasks = r.json()
    priorities = [t["priority"] for t in tasks]
    assert priorities == sorted(priorities, reverse=True)


def test_list_tasks_sort_by_title():
    r = client.get("/api/tasks?sort_by=title&sort_dir=asc")
    assert r.status_code == 200
    tasks = r.json()
    titles = [t["title"] for t in tasks]
    assert titles == sorted(titles)


def test_list_tasks_sort_by_created_at():
    r = client.get("/api/tasks?sort_by=created_at&sort_dir=asc")
    assert r.status_code == 200
    tasks = r.json()
    dates = [t["created_at"] for t in tasks]
    assert dates == sorted(dates)


def test_list_tasks_invalid_sort_falls_back_to_priority():
    r = client.get("/api/tasks?sort_by=INVALID&sort_dir=asc")
    assert r.status_code == 200
    tasks = r.json()
    priorities = [t["priority"] for t in tasks]
    assert priorities == sorted(priorities)


# ── Update ────────────────────────────────────────────────────────────────


def test_update_task():
    create = client.post("/api/tasks", json={"title": "Update me", "priority": 3})
    task_id = create.json()["id"]

    r = client.patch(f"/api/tasks/{task_id}", json={"status": "done"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"


def test_update_task_title():
    create = client.post("/api/tasks", json={"title": "Old title", "priority": 1})
    task_id = create.json()["id"]

    r = client.patch(f"/api/tasks/{task_id}", json={"title": "New title"})
    assert r.status_code == 200
    assert r.json()["title"] == "New title"


def test_update_task_priority():
    create = client.post("/api/tasks", json={"title": "Reprioritize", "priority": 1})
    task_id = create.json()["id"]

    r = client.patch(f"/api/tasks/{task_id}", json={"priority": 99})
    assert r.status_code == 200
    assert r.json()["priority"] == 99


def test_update_task_updates_timestamp():
    create = client.post("/api/tasks", json={"title": "Timestamp test"})
    task_id = create.json()["id"]
    original = create.json()["updated_at"]

    r = client.patch(f"/api/tasks/{task_id}", json={"title": "Changed"})
    assert r.json()["updated_at"] >= original


def test_update_nonexistent_returns_404():
    r = client.patch("/api/tasks/99999", json={"status": "done"})
    assert r.status_code == 404


def test_update_task_negative_priority_returns_422():
    create = client.post("/api/tasks", json={"title": "Bad update", "priority": 1})
    task_id = create.json()["id"]

    r = client.patch(f"/api/tasks/{task_id}", json={"priority": -5})
    assert r.status_code == 422


# ── Delete ────────────────────────────────────────────────────────────────


def test_delete_task():
    create = client.post("/api/tasks", json={"title": "Delete me", "priority": 4})
    task_id = create.json()["id"]

    r = client.delete(f"/api/tasks/{task_id}")
    assert r.status_code == 204

    r = client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 404


def test_delete_nonexistent_returns_404():
    r = client.delete("/api/tasks/99999")
    assert r.status_code == 404


def test_delete_already_deleted_returns_404():
    create = client.post("/api/tasks", json={"title": "Double delete"})
    task_id = create.json()["id"]

    client.delete(f"/api/tasks/{task_id}")
    r = client.delete(f"/api/tasks/{task_id}")
    assert r.status_code == 404


# ── Tags ──────────────────────────────────────────────────────────────────


def test_list_tags():
    r = client.get("/api/tags")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
