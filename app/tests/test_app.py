from collections.abc import Awaitable, Generator

import pytest
import tornado
from prometheus_client import CollectorRegistry
from tornado.httpclient import AsyncHTTPClient, HTTPResponse

from mypy_playground.app import make_app


@pytest.fixture
def app() -> tornado.web.Application:
    return make_app(prometheus_registry=CollectorRegistry())


@pytest.mark.gen_test
def test_index(
    http_client: AsyncHTTPClient, base_url: str
) -> Generator[Awaitable[HTTPResponse], HTTPResponse]:
    response = yield http_client.fetch(base_url)
    assert response.code == 200
