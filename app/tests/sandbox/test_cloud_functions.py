import json
from collections.abc import Callable, Iterator
from typing import Any

import google.auth.exceptions
import httpx
import pytest
from pytest_mock import MockerFixture

from mypy_playground.config import get_settings
from mypy_playground.sandbox.base import Result
from mypy_playground.sandbox.cloud_functions import CloudFunctionsSandbox

BASE_URL = "https://example.com/"
FUNCTION_URL = "https://example.com/mypy-latest"

Handler = Callable[[httpx.Request], httpx.Response]


@pytest.fixture(autouse=True)
def _settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setenv("CLOUD_FUNCTIONS_BASE_URL", BASE_URL)
    monkeypatch.delenv("CLOUD_FUNCTIONS_IDENTITY_TOKEN", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


class MockCloudFunction:
    """Records requests sent by the sandbox and returns canned responses."""

    def __init__(self) -> None:
        self.requests: list[httpx.Request] = []
        self.clients: list[httpx.AsyncClient] = []
        self.handler: Handler = self.respond

    def respond(self, request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"exit_code": 1, "stdout": "out", "stderr": "err"}
        )

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)


@pytest.fixture
def cloud_function(mocker: MockerFixture) -> MockCloudFunction:
    """Route requests from clients created by the sandbox to a mock transport"""
    mock = MockCloudFunction()
    async_client = httpx.AsyncClient

    def create_client(**kwargs: Any) -> httpx.AsyncClient:
        client = async_client(transport=httpx.MockTransport(mock), **kwargs)
        mock.clients.append(client)
        return client

    mocker.patch(
        "mypy_playground.sandbox.cloud_functions.httpx.AsyncClient",
        side_effect=create_client,
    )
    return mock


class FakeCredentials:
    def __init__(self) -> None:
        self.token: str | None = None
        self.valid = False
        self.refresh_count = 0

    def refresh(self, request: Any) -> None:
        self.refresh_count += 1
        self.token = f"token-{self.refresh_count}"
        self.valid = True


async def test_run_typecheck_reuses_client_and_caches_token(
    mocker: MockerFixture, cloud_function: MockCloudFunction
) -> None:
    credentials = FakeCredentials()
    fetch = mocker.patch(
        "google.oauth2.id_token.fetch_id_token_credentials",
        return_value=credentials,
    )
    async with CloudFunctionsSandbox() as sandbox:
        for _ in range(2):
            result = await sandbox.run_typecheck(
                "import this", mypy_version="latest", python_version="3.14"
            )
            assert isinstance(result, Result)
            assert (result.exit_code, result.stdout, result.stderr) == (
                1,
                "out",
                "err",
            )

    assert len(cloud_function.clients) == 1
    fetch.assert_called_once_with(FUNCTION_URL, sandbox._auth_request)
    assert credentials.refresh_count == 1
    assert len(cloud_function.requests) == 2
    for request in cloud_function.requests:
        assert str(request.url) == FUNCTION_URL
        assert request.headers["Authorization"] == "Bearer token-1"
        assert request.headers["User-Agent"] == "mypy-playground"
        assert json.loads(request.content) == {
            "source": "import this",
            "options": [
                "--cache-dir",
                "/dev/null",
                "--no-site-packages",
                "--python-version",
                "3.14",
            ],
        }


async def test_run_typecheck_refreshes_expired_token(
    mocker: MockerFixture, cloud_function: MockCloudFunction
) -> None:
    credentials = FakeCredentials()
    mocker.patch(
        "google.oauth2.id_token.fetch_id_token_credentials",
        return_value=credentials,
    )
    async with CloudFunctionsSandbox() as sandbox:
        await sandbox.run_typecheck("", mypy_version="latest")
        credentials.valid = False  # Simulate expiry
        await sandbox.run_typecheck("", mypy_version="latest")

    assert credentials.refresh_count == 2
    assert cloud_function.requests[1].headers["Authorization"] == "Bearer token-2"


async def test_run_typecheck_uses_identity_token_from_settings(
    mocker: MockerFixture,
    monkeypatch: pytest.MonkeyPatch,
    cloud_function: MockCloudFunction,
) -> None:
    monkeypatch.setenv("CLOUD_FUNCTIONS_IDENTITY_TOKEN", "dev-token")
    get_settings.cache_clear()
    fetch = mocker.patch("google.oauth2.id_token.fetch_id_token_credentials")
    async with CloudFunctionsSandbox() as sandbox:
        await sandbox.run_typecheck("", mypy_version="latest")

    fetch.assert_not_called()
    assert cloud_function.requests[0].headers["Authorization"] == "Bearer dev-token"


async def test_run_typecheck_auth_error(
    mocker: MockerFixture, cloud_function: MockCloudFunction
) -> None:
    mocker.patch(
        "google.oauth2.id_token.fetch_id_token_credentials",
        side_effect=google.auth.exceptions.DefaultCredentialsError(  # type: ignore[no-untyped-call]
            "no credentials"
        ),
    )
    async with CloudFunctionsSandbox() as sandbox:
        assert await sandbox.run_typecheck("", mypy_version="latest") is None
    assert cloud_function.requests == []


async def test_run_typecheck_unknown_mypy_version(
    cloud_function: MockCloudFunction,
) -> None:
    async with CloudFunctionsSandbox() as sandbox:
        assert await sandbox.run_typecheck("", mypy_version="unknown") is None
    assert cloud_function.requests == []


async def test_run_typecheck_unexpected_status(
    monkeypatch: pytest.MonkeyPatch, cloud_function: MockCloudFunction
) -> None:
    monkeypatch.setenv("CLOUD_FUNCTIONS_IDENTITY_TOKEN", "dev-token")
    get_settings.cache_clear()
    cloud_function.handler = lambda request: httpx.Response(500)
    async with CloudFunctionsSandbox() as sandbox:
        assert await sandbox.run_typecheck("", mypy_version="latest") is None


async def test_run_typecheck_http_error(
    monkeypatch: pytest.MonkeyPatch, cloud_function: MockCloudFunction
) -> None:
    monkeypatch.setenv("CLOUD_FUNCTIONS_IDENTITY_TOKEN", "dev-token")
    get_settings.cache_clear()

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    cloud_function.handler = handler
    async with CloudFunctionsSandbox() as sandbox:
        assert await sandbox.run_typecheck("", mypy_version="latest") is None


async def test_aclose_closes_client() -> None:
    async with CloudFunctionsSandbox() as sandbox:
        client = sandbox._client
        assert not client.is_closed
    assert client.is_closed
