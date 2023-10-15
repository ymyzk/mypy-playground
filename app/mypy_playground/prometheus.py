from typing import TYPE_CHECKING, Any, Optional

import tornado
from prometheus_client import REGISTRY, Counter, Histogram
from tornado.web import RequestHandler

_NAMESPACE = "mypy_play"
_SUB_SYSTEM = "http"


if TYPE_CHECKING:
    _Base = tornado.web.Application
else:
    _Base = object


class PrometheusMixin(_Base):
    """Mixin for tornado.web.Application"""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.prometheus_registry = kwargs.get("prometheus_registry", REGISTRY)
        self._requests_total_counter = Counter(
            registry=self.prometheus_registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="requests_total",
            documentation="Counter of HTTP requests.",
            labelnames=("handler", "method", "code"),
        )
        self._requests_duration_seconds_histogram = Histogram(
            registry=self.prometheus_registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="request_duration_seconds",
            documentation="Histogram of latencies for HTTP requests.",
            buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 3, 8, 20, 60),
            labelnames=("handler", "method"),
        )
        self._response_size_bytes_histogram = Histogram(
            registry=self.prometheus_registry,
            namespace=_NAMESPACE,
            subsystem=_SUB_SYSTEM,
            name="response_size_bytes",
            documentation="Histogram of response size for HTTP requests.",
            buckets=(10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000),
            labelnames=("handler", "method"),
        )

    def log_request(self, handler: RequestHandler) -> None:
        super().log_request(handler)
        self._update_metrics(handler)

    def _update_metrics(self, handler: RequestHandler) -> None:
        method = handler.request.method
        handler_name = type(handler).__name__
        content_length_str = handler._headers.get("Content-Length")
        try:
            if isinstance(content_length_str, str):
                content_length: Optional[int] = int(content_length_str)
            else:
                content_length = None
        except ValueError:
            content_length = None

        self._requests_duration_seconds_histogram.labels(handler_name, method).observe(
            handler.request.request_time()
        )
        self._requests_total_counter.labels(
            handler_name, method, handler.get_status()
        ).inc()
        if isinstance(content_length, int):
            self._response_size_bytes_histogram.labels(handler_name, method).observe(
                content_length
            )
