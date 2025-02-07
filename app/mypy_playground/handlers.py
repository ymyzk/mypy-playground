import dataclasses
import json
import logging
import traceback
from http import HTTPStatus
from typing import Any, cast

import tornado.escape
import tornado.web
from prometheus_client import exposition
from tornado.options import options

from mypy_playground import gist
from mypy_playground.prometheus import PrometheusMixin
from mypy_playground.sandbox import run_typecheck_in_sandbox
from mypy_playground.sandbox.base import (
    ARGUMENT_FLAGS,
    ARGUMENT_MULTI_SELECT_OPTIONS,
    AbstractSandbox,
)
from mypy_playground.sandbox.cloud_functions import CloudFunctionsSandbox
from mypy_playground.sandbox.docker import DockerSandbox

logger = logging.getLogger(__name__)
initial_code = """from typing import Iterator


def fib(n: int) -> Iterator[int]:
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b


fib(10)
fib("10")
"""


class StaticFileHandlerWithCustomErrorPages(tornado.web.StaticFileHandler):
    """StaticFileHandler to return custom error page on certain status code"""

    def initialize(
        self,
        path: str,
        default_filename: str | None = None,
        error_pages: dict[int, str] | None = None,
    ) -> None:
        super().initialize(path, default_filename)
        self.error_pages: dict[int, str] = error_pages or {}

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        if self.settings.get("serve_traceback") and "exc_info" in kwargs:
            # Use default write_error to serve traceback
            super().write_error(status_code, **kwargs)
        elif status_code not in self.error_pages:
            # Use default write_error in case a custom page is not defined
            super().write_error(status_code, **kwargs)
        else:
            # Render a custom error page in the static directory
            path = self.error_pages[status_code]
            absolute_path = self.get_absolute_path(self.root, path)
            for chunk in self.get_content(absolute_path):
                self.write(chunk)
            self.finish()


class JsonRequestHandler(tornado.web.RequestHandler):
    def prepare(self) -> None:
        if self.request.method in {"HEAD", "GET"}:
            return
        content_type = self.request.headers.get("Content-Type", "")
        if not content_type.startswith("application/json"):
            raise tornado.web.HTTPError(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                log_message="Content-type must be application/json",
            )

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        error = {}

        if "exc_info" in kwargs:
            exc_info = kwargs["exc_info"]
            if self.settings.get("serve_traceback"):
                # in debug mode, try to send a traceback
                lines = traceback.format_exception(*exc_info)
                error["traceback"] = "\n".join(lines)

            exc = exc_info[1]
            if isinstance(exc, tornado.web.HTTPError) and exc.log_message:
                error["message"] = exc.log_message

        self.finish(error)

    def parse_json_request_body(self) -> Any:
        try:
            return tornado.escape.json_decode(self.request.body)
        except json.JSONDecodeError as e:
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST, log_message="failed to parse JSON body"
            ) from e


class ContextHandler(JsonRequestHandler):
    async def get(self) -> None:
        mypy_versions = options.mypy_versions
        config: dict[str, bool | str | list[str]] = {
            flag: False for flag in ARGUMENT_FLAGS
        }
        for option in ARGUMENT_MULTI_SELECT_OPTIONS:
            config[option] = []
        config["mypyVersion"] = mypy_versions[0][1]
        config["pythonVersion"] = options.default_python_version
        # Make sure that the context type matches with app/frontend/types.tsx
        context = {
            "defaultConfig": config,
            "initialCode": initial_code,
            "pythonVersions": options.python_versions,
            "mypyVersions": mypy_versions,
            "flags": ARGUMENT_FLAGS,
            "multiSelectOptions": ARGUMENT_MULTI_SELECT_OPTIONS,
            "gaTrackingId": options.ga_tracking_id,
        }
        self.write(context)


class TypecheckHandler(JsonRequestHandler):
    async def post(self) -> None:
        json = self.parse_json_request_body()

        source = json.get("source")
        if source is None or not isinstance(source, str):
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST, log_message="'source' is required"
            )

        args = {}
        if (
            version := json.get("pythonVersion")
        ) is not None and version in options.python_versions:
            args["python_version"] = version
        for flag in ARGUMENT_FLAGS:
            flag_value = json.get(flag)
            if flag_value is not None and flag_value is True:
                args[flag] = flag_value
        for option, choices in ARGUMENT_MULTI_SELECT_OPTIONS.items():
            option_value = json.get(option)
            if not isinstance(option_value, list):
                continue
            option_values = [value for value in option_value if value in choices]
            if len(option_values) == 0:
                continue
            args[option] = option_values
        if mypy_version := json.get("mypyVersion"):
            args["mypy_version"] = mypy_version
        else:
            # Use the first item as the default
            args["mypy_version"] = options.mypy_versions

        sandbox = self._get_sandbox()
        result = await run_typecheck_in_sandbox(sandbox, source, **args)
        if result is None:
            logger.error("an error occurred during running type-check")
            raise tornado.web.HTTPError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                log_message="an error occurred during running mypy",
            )

        self.write(dataclasses.asdict(result))

    def _get_sandbox(self) -> AbstractSandbox:
        sandbox_class = options["sandbox"]
        if sandbox_class == "mypy_playground.sandbox.docker.DockerSandbox":
            return DockerSandbox()
        elif (
            sandbox_class
            == "mypy_playground.sandbox.cloud_functions.CloudFunctionsSandbox"
        ):
            return CloudFunctionsSandbox()
        raise Exception("Unsupported sandbox")


class GistHandler(JsonRequestHandler):
    async def post(self) -> None:
        json = self.parse_json_request_body()

        source = json.get("source")
        if source is None or not isinstance(source, str):
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST, log_message="'source' is required"
            )

        result = await gist.create_gist(source)

        if result is None:
            logger.error("an error occurred during creating a gist")
            raise tornado.web.HTTPError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                log_message="an error occurred during creating a gist",
            )

        self.set_status(201)
        self.write(result)


class PrometheusMetricsHandler(tornado.web.RequestHandler):
    """Endpoint to expose Prometheus metrics.

    This handler must be used with PrometheusMixin for getting a registry.
    """

    async def get(self) -> None:
        accept_header = self.request.headers.get("accept")
        if not isinstance(accept_header, str):
            accept_header = ""
        encoder, content_type = exposition.choose_encoder(accept_header)
        application = cast(PrometheusMixin, self.application)
        output = encoder(application.prometheus_registry)
        self.set_header("Content-Type", content_type)
        self.write(output)
