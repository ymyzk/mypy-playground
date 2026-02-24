import pytest
from fastapi.testclient import TestClient

from mypy_playground.app import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_api_context(client: TestClient) -> None:
    """Test the /api/context endpoint"""
    response = client.get("/api/context")
    assert response.status_code == 200
    data = response.json()
    assert "defaultConfig" in data
    assert "pythonVersions" in data
    assert "mypyVersions" in data
    assert "flags" in data
    assert "multiSelectOptions" in data


def test_api_typecheck_missing_source(client: TestClient) -> None:
    """Test typecheck endpoint with missing source"""
    response = client.post("/api/typecheck", json={})
    assert response.status_code == 422  # Validation error


def test_api_404_json(client: TestClient) -> None:
    """Test that non-existent API paths return JSON 404"""
    response = client.get("/api/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
