import pytest
import tornado
from prometheus_client import CollectorRegistry
from pytest_mock import MockerFixture

from mypy_playground.prometheus import PrometheusMixin


class DummyApplication(PrometheusMixin, tornado.web.Application):
    pass


@pytest.fixture
def app() -> DummyApplication:
    registry = CollectorRegistry()
    return DummyApplication(prometheus_registry=registry)


def test_log_request_succeeds(mocker: MockerFixture, app: DummyApplication) -> None:
    registry = app.prometheus_registry

    mock_handler = mocker.MagicMock()
    mock_handler.get_status.return_value = 200
    mock_handler.request.method = "GET"
    mock_handler.request.request_time.return_value = 1.234  # seconds
    mock_handler._headers.get.return_value = "987"

    app.log_request(mock_handler)

    assert (
        registry.get_sample_value(
            "mypy_play_http_requests_total",
            {"handler": "MagicMock", "method": "GET", "code": "200"},
        )
        == 1.0
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_request_duration_seconds_count",
            {"handler": "MagicMock", "method": "GET"},
        )
        == 1.0
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_request_duration_seconds_sum",
            {"handler": "MagicMock", "method": "GET"},
        )
        == 1.234
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_response_size_bytes_count",
            {"handler": "MagicMock", "method": "GET"},
        )
        == 1.0
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_response_size_bytes_sum",
            {"handler": "MagicMock", "method": "GET"},
        )
        == 987.0
    )


def test_log_request_with_invalid_content_length(
    mocker: MockerFixture, app: DummyApplication
) -> None:
    registry = app.prometheus_registry

    mock_handler = mocker.MagicMock()
    mock_handler.get_status.return_value = 200
    mock_handler.request.method = "GET"
    mock_handler.request.request_time.return_value = 1.234  # seconds

    # Without header
    app.log_request(mock_handler)

    # Empty string
    mock_handler._headers.get.return_value = ""
    app.log_request(mock_handler)

    # Invalid type
    mock_handler._headers.get.return_value = []
    app.log_request(mock_handler)

    assert (
        registry.get_sample_value(
            "mypy_play_http_response_size_bytes_count",
            {"handler": "MagicMock", "method": "GET"},
        )
        is None
    )
    assert (
        registry.get_sample_value(
            "mypy_play_http_response_size_bytes_sum",
            {"handler": "MagicMock", "method": "GET"},
        )
        is None
    )
