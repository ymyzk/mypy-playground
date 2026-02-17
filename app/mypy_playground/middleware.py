import contextlib
import time

from fastapi import Request
from prometheus_client import REGISTRY, Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

_NAMESPACE = "mypy_play"
_SUB_SYSTEM = "http"


class PrometheusMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for Prometheus metrics collection"""

    def __init__(self, app, registry=None):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self.registry = registry or REGISTRY

        self._requests_total_counter = Counter(
            registry=self.registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="requests_total",
            documentation="Counter of HTTP requests.",
            labelnames=("handler", "method", "code"),
        )
        self._requests_duration_seconds_histogram = Histogram(
            registry=self.registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="request_duration_seconds",
            documentation="Histogram of latencies for HTTP requests.",
            buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 3, 8, 20, 60),
            labelnames=("handler", "method"),
        )
        self._response_size_bytes_histogram = Histogram(
            registry=self.registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="response_size_bytes",
            documentation="Histogram of response size for HTTP requests.",
            buckets=(10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000),
            labelnames=("handler", "method"),
        )

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        """Collect metrics for each request"""
        start_time = time.time()

        response: Response = await call_next(request)

        duration = time.time() - start_time
        method = request.method
        # Use the path as handler name (closest to Tornado's handler name)
        handler_name = request.url.path
        status_code = response.status_code

        # Update metrics
        self._requests_duration_seconds_histogram.labels(handler_name, method).observe(
            duration
        )
        self._requests_total_counter.labels(handler_name, method, status_code).inc()

        # Get response size from Content-Length header if available
        content_length = response.headers.get("content-length")
        if content_length:
            with contextlib.suppress(ValueError):
                self._response_size_bytes_histogram.labels(
                    handler_name, method
                ).observe(int(content_length))

        return response
