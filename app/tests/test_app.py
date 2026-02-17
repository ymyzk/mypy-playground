import pytest
from fastapi.testclient import TestClient

from mypy_playground.app import create_app
from mypy_playground.config import get_settings


@pytest.fixture
def client() -> TestClient:
    """Create a test client with test settings"""
    get_settings.cache_clear()

    app = create_app()
    return TestClient(app)


def test_index(client: TestClient) -> None:
    """Test that the index page is served"""
    response = client.get("/")
    assert response.status_code == 200


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
    assert "message" in data
