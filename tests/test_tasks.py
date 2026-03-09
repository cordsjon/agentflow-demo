"""Task CRUD tests — demonstrates test-driven development pattern."""

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
    import os
    if os.path.exists("test.db"):
        os.remove("test.db")


client = TestClient(app)


def test_health_returns_ok():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_task():
    r = client.post("/api/tasks", json={"title": "Test task", "priority": 1})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test task"
    assert data["status"] == "todo"
    assert data["id"] is not None


def test_list_tasks():
    r = client.get("/api/tasks")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_task():
    # Create first
    create = client.post("/api/tasks", json={"title": "Get me", "priority": 2})
    task_id = create.json()["id"]

    r = client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "Get me"


def test_update_task():
    create = client.post("/api/tasks", json={"title": "Update me", "priority": 3})
    task_id = create.json()["id"]

    r = client.patch(f"/api/tasks/{task_id}", json={"status": "done"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"


def test_delete_task():
    create = client.post("/api/tasks", json={"title": "Delete me", "priority": 4})
    task_id = create.json()["id"]

    r = client.delete(f"/api/tasks/{task_id}")
    assert r.status_code == 204

    r = client.get(f"/api/tasks/{task_id}")
    assert r.status_code == 404


def test_get_nonexistent_returns_404():
    r = client.get("/api/tasks/99999")
    assert r.status_code == 404


def test_list_tasks_filter_by_status():
    client.post("/api/tasks", json={"title": "Todo item", "priority": 10})
    r = client.get("/api/tasks?status=todo")
    assert r.status_code == 200
    for task in r.json():
        assert task["status"] == "todo"
