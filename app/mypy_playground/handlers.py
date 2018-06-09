import logging

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
        context = {
            "initial_code": initial_code,
            "python_versions": sandbox.PYTHON_VERSIONS,
            "flags_normal": sandbox.ARGUMENT_FLAGS_NORMAL,
            "flags_strict": sandbox.ARGUMENT_FLAGS_STRICT,
            "ga_tracking_id": options.ga_tracking_id,
        }
        self.render("index.html", **context)


class TypecheckHandler(tornado.web.RequestHandler):
    async def post(self) -> None:
        json = tornado.escape.json_decode(self.request.body)

        source = json.get("source")
        if source is None or not isinstance(source, str):
            # TODO: JSON
            self.send_error(400)
            return

        args = {}
        python_version = json.get("python_version")
        if (python_version is not None
                and python_version in sandbox.PYTHON_VERSIONS):
            args["python_version"] = python_version
        for flag in sandbox.ARGUMENT_FLAGS:
            flag_value = json.get(flag)
            if flag_value is not None and flag_value is True:
                args[flag] = flag_value

        docker_sandbox: sandbox.AbstractSandbox = sandbox.DockerSandbox(
            docker_image=options.docker_image
        )
        result = await docker_sandbox.run_typecheck(source, **args)
        if result is None:
            logger.warning("an error occurred during running type-check")
            self.send_error(500)
            return

        self.write(result.to_dict())


class GistHandler(tornado.web.RequestHandler):
    async def post(self) -> None:
        json = tornado.escape.json_decode(self.request.body)

        source = json.get("source")
        if source is None or not isinstance(source, str):
            self.send_error(400)
            return

        result = await gist.create_gist(source)

        if result is None:
            self.send_error(500)
            return

        self.set_status(201)
        self.write(result)
