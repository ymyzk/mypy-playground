from collections.abc import Iterator
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from pytest_mock import MockerFixture

from mypy_playground.main import app
from mypy_playground.routes import get_sandbox
from mypy_playground.sandbox.base import Result


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def mock_sandbox(mocker: MockerFixture) -> Iterator[AsyncMock]:
    sandbox = mocker.AsyncMock()
    app.dependency_overrides[get_sandbox] = lambda: sandbox
    yield sandbox
    app.dependency_overrides.pop(get_sandbox)


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


def test_api_typecheck_missing_source(
    client: TestClient, mock_sandbox: AsyncMock
) -> None:
    """Test typecheck endpoint with missing source"""
    response = client.post("/api/typecheck", json={})
    assert response.status_code == 422  # Validation error


def test_api_404_json(client: TestClient) -> None:
    """Test that non-existent API paths return JSON 404"""
    response = client.get("/api/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


def test_lifespan_opens_and_closes_sandbox(mocker: MockerFixture) -> None:
    """Test that the sandbox lives as long as the app and is closed on shutdown"""
    sandbox = mocker.AsyncMock()
    sandbox.__aenter__.return_value = sandbox
    create_sandbox = mocker.patch(
        "mypy_playground.main._create_sandbox", return_value=sandbox
    )
    try:
        with TestClient(app):
            create_sandbox.assert_called_once()
            assert app.state.sandbox is sandbox
            sandbox.__aexit__.assert_not_awaited()
        sandbox.__aexit__.assert_awaited_once()
    finally:
        del app.state.sandbox


def test_api_typecheck(client: TestClient, mock_sandbox: AsyncMock) -> None:
    """Test typecheck endpoint uses the shared sandbox"""
    mock_sandbox.run_typecheck.return_value = Result(
        exit_code=1, stdout="out", stderr="err", duration=10
    )
    response = client.post(
        "/api/typecheck", json={"source": "import this", "strict": True}
    )
    assert response.status_code == 200
    assert response.json() == {
        "exit_code": 1,
        "stdout": "out",
        "stderr": "err",
        "duration": 10,
    }
    mock_sandbox.run_typecheck.assert_awaited_once()
    args, kwargs = mock_sandbox.run_typecheck.call_args
    assert args == ("import this",)
    assert kwargs["strict"] is True


def test_api_typecheck_sandbox_error(
    client: TestClient, mock_sandbox: AsyncMock
) -> None:
    """Test typecheck endpoint returns 500 when the sandbox fails"""
    mock_sandbox.run_typecheck.return_value = None
    response = client.post("/api/typecheck", json={"source": "import this"})
    assert response.status_code == 500
