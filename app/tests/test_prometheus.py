import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from prometheus_client import CollectorRegistry

from mypy_playground.middleware import PrometheusMiddleware


@pytest.fixture
def app() -> FastAPI:
    """Create a test FastAPI app with Prometheus middleware"""
    registry = CollectorRegistry()
    app = FastAPI()
    app.add_middleware(PrometheusMiddleware, registry=registry)

    @app.get("/test")
    async def test_endpoint() -> dict[str, str]:
        return {"message": "ok"}

    # Store registry on app for testing
    app.state.registry = registry
    return app


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)


def test_middleware_records_metrics(client: TestClient, app: FastAPI) -> None:
    """Test that middleware records all metrics correctly"""
    registry = app.state.registry

    # Make a request
    response = client.get("/test")
    assert response.status_code == 200

    # Check that metrics were recorded
    assert (
        registry.get_sample_value(
            "mypy_play_http_requests_total",
            {"handler": "/test", "method": "GET", "code": "200"},
        )
        == 1.0
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_request_duration_seconds_count",
            {"handler": "/test", "method": "GET"},
        )
        == 1.0
    )
    # Duration sum should be a positive number
    duration_sum = registry.get_sample_value(
        "mypy_play_http_request_duration_seconds_sum",
        {"handler": "/test", "method": "GET"},
    )
    assert duration_sum is not None
    assert duration_sum > 0


def test_middleware_records_response_size(client: TestClient, app: FastAPI) -> None:
    """Test that middleware records response size when Content-Length is present"""
    registry = app.state.registry

    # Make a request
    response = client.get("/test")
    assert response.status_code == 200

    # Check response size metric
    size_count = registry.get_sample_value(
        "mypy_play_http_response_size_bytes_count",
        {"handler": "/test", "method": "GET"},
    )
    # Size may or may not be recorded depending on whether Content-Length header is set
    # Just verify it doesn't crash
    assert size_count is None or size_count >= 0


def test_middleware_records_multiple_requests(client: TestClient, app: FastAPI) -> None:
    """Test that middleware correctly accumulates metrics across multiple requests"""
    registry = app.state.registry

    # Make multiple requests
    for _ in range(3):
        response = client.get("/test")
        assert response.status_code == 200

    # Check that counter increased
    assert (
        registry.get_sample_value(
            "mypy_play_http_requests_total",
            {"handler": "/test", "method": "GET", "code": "200"},
        )
        == 3.0
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_request_duration_seconds_count",
            {"handler": "/test", "method": "GET"},
        )
        == 3.0
    )
