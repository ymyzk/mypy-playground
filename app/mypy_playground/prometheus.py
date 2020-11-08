from typing import Optional, TYPE_CHECKING

import tornado
from prometheus_client import Counter, Histogram
from tornado.web import RequestHandler


_NAMESPACE = "mypy_play"
_SUB_SYSTEM = "http"
_REQUESTS_TOTAL_COUNTER = Counter(
    namespace=_NAMESPACE,
    subsystem=_SUB_SYSTEM,
    name="requests_total",
    documentation="Counter of HTTP requests.",
    labelnames=("handler", "method", "code"),
)
_REQUESTS_DURATION_SECONDS_HISTOGRAM = Histogram(
    namespace=_NAMESPACE,
    subsystem=_SUB_SYSTEM,
    name="requests_duration_seconds",
    documentation="Histogram of latencies for HTTP requests.",
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 3, 8, 20, 60),
    labelnames=("handler", "method"),
)
_RESPONSE_SIZE_BYTES_HISTOGRAM = Histogram(
    namespace=_NAMESPACE,
    subsystem=_SUB_SYSTEM,
    name="response_size_bytes",
    documentation="Histogram of response size for HTTP requests.",
    buckets=(10, 100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000),
    labelnames=("handler", "method"),
)


if TYPE_CHECKING:
    _Base = tornado.web.Application
else:
    _Base = object


class PrometheusMixin(_Base):
    """Mixin for tornado.web.Application"""

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

        _REQUESTS_DURATION_SECONDS_HISTOGRAM.labels(handler_name, method).observe(
            handler.request.request_time()
        )
        _REQUESTS_TOTAL_COUNTER.labels(handler_name, method, handler.get_status()).inc()
        if isinstance(content_length, int):
            _RESPONSE_SIZE_BYTES_HISTOGRAM.labels(handler_name, method).observe(
                content_length
            )
