from functools import lru_cache
from http import HTTPStatus
import json
import logging
import traceback
from typing import Any, Dict, List, Optional, Tuple, cast

import tornado.escape
from tornado.options import options
import tornado.web

from . import gist, sandbox


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


class IndexHandler(tornado.web.RequestHandler):
    async def get(self) -> None:
        mypy_versions = get_mypy_versions()
        default = {flag: False for flag in sandbox.ARGUMENT_FLAGS}
        default["mypyVersion"] = mypy_versions[0][1]
        default["pythonVersion"] = sandbox.PYTHON_VERSIONS[0]
        context = {
            "defaultConfig": default,
            "initial_code": initial_code,
            "python_versions": sandbox.PYTHON_VERSIONS,
            "mypy_versions": mypy_versions,
            "flags": sandbox.ARGUMENT_FLAGS,
            "ga_tracking_id": options.ga_tracking_id,
        }
        self.render("index.html", context=json.dumps(context))


class JsonRequestHandler(tornado.web.RequestHandler):
    def prepare(self) -> None:
        content_type = self.request.headers.get("Content-Type", "")
        if not content_type.startswith("application/json"):
            raise tornado.web.HTTPError(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                log_message="Content-type must be application/json")

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
        except json.JSONDecodeError:
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST,
                log_message="failed to parse JSON body")


class TypecheckHandler(JsonRequestHandler):
    async def post(self) -> None:
        json = self.parse_json_request_body()

        source = json.get("source")
        if source is None or not isinstance(source, str):
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST,
                log_message="'source' is required")

        args = {}
        python_version = json.get("python_version")
        if (python_version is not None
                and python_version in sandbox.PYTHON_VERSIONS):
            args["python_version"] = python_version
        for flag in sandbox.ARGUMENT_FLAGS:
            flag_value = json.get(flag)
            if flag_value is not None and flag_value is True:
                args[flag] = flag_value

        mypy_version = json.get("mypy_version")
        if mypy_version is None:
            mypy_version = "latest"
        docker_image = get_docker_image(mypy_version)
        if docker_image is None:
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST,
                log_message="invalid 'mypy_version'")

        docker_sandbox: sandbox.AbstractSandbox = sandbox.DockerSandbox(
            docker_image=docker_image
        )
        result = await sandbox.run_typecheck_in_sandbox(
            docker_sandbox,
            source,
            **args
        )
        if result is None:
            logger.error("an error occurred during running type-check")
            raise tornado.web.HTTPError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                log_message="an error occurred during running mypy")

        self.write(result.to_dict())


class GistHandler(JsonRequestHandler):
    async def post(self) -> None:
        json = self.parse_json_request_body()

        source = json.get("source")
        if source is None or not isinstance(source, str):
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST,
                log_message="'source' is required")

        result = await gist.create_gist(source)

        if result is None:
            logger.error("an error occurred during creating a gist")
            raise tornado.web.HTTPError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                log_message="an error occurred during running mypy")

        self.set_status(201)
        self.write(result)


@lru_cache()
def parse_option_as_dict(name: str) -> Dict[str, str]:
    # This function assumes that dict is insertion order-preserving
    # (Python 3.7+)
    return dict(
        cast(List[Tuple[str, str]],
             [tuple(i.split(":", 1)) for i in options[name].split(",")])
    )


@lru_cache(maxsize=1)
def get_mypy_versions() -> List[Tuple[str, str]]:
    return list(parse_option_as_dict("mypy_versions").items())


def get_docker_image(mypy_version_id: str) -> Optional[str]:
    return parse_option_as_dict("docker_images").get(mypy_version_id)
