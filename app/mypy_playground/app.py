import logging
from os import environ, path

import tornado.escape
import tornado.ioloop
from tornado.options import define, options
import tornado.web

from . import gist, sandbox
from .utils import setup_logger


logging.getLogger("tornado.access").setLevel(logging.INFO)
logger = setup_logger(__name__)
root_dir = path.dirname(path.dirname(__file__))
static_dir = path.join(root_dir, "static")
templates_dir = path.join(root_dir, "templates")
python_versions = [str(v) for v in (2.7, 3.3, 3.4, 3.5, 3.6)]
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
    async def get(self):
        context = {
            "initial_code": initial_code,
            "python_versions": python_versions,
            "flags_normal": sandbox.ARGUMENT_FLAGS_NORMAL,
            "flags_strict": sandbox.ARGUMENT_FLAGS_STRICT,
            "ga_tracking_id": options.ga_tracking_id,
        }
        self.render("index.html", **context)


class TypecheckHandler(tornado.web.RequestHandler):
    def post(self):
        json = tornado.escape.json_decode(self.request.body)

        source = json.get("source")
        if source is None or not isinstance(source, str):
            # TODO: JSON
            self.send_error(400)
            return

        options = {}
        python_version = json.get("python_version")
        if python_version is not None and python_version in python_versions:
            options["python_version"] = python_version
        for flag in sandbox.ARGUMENT_FLAGS:
            flag_value = json.get(flag)
            if flag_value is not None and flag_value is True:
                options[flag] = flag_value

        result = sandbox.run_typecheck(source, **options)
        if result is None:
            logger.warn("an error occurred during running type-check")
            self.send_error(500)
            return

        self.write(result.to_dict())


class GistHandler(tornado.web.RequestHandler):
    def post(self):
        json = tornado.escape.json_decode(self.request.body)

        source = json.get("source")
        if source is None or not isinstance(source, str):
            self.send_error(400)
            return

        result = gist.create_gist(source)

        if result is None:
            self.send_error(500)
            return

        self.set_status(201)
        self.write(result)


def make_app(**kwargs):
    routes = [
        (r"/typecheck.json", TypecheckHandler),
        (r"/gist", GistHandler),
        (r"/", IndexHandler),
    ]
    return tornado.web.Application(
        routes,
        static_path=static_dir,
        template_path=templates_dir,
        **kwargs)


define("ga_tracking_id", default=None, help="Google Analytics tracking ID")
define("github_token", default=None,
       help="GitHub API token for creating gists")
define("port", default=8080, help="Port number")
define("debug", default=False, help="Debug mode")

options.ga_tracking_id = environ.get("MYPY_PLAY_GA_TRACKING_ID")
options.github_token = environ.get("MYPY_PLAY_GITHUB_TOKEN")
port = environ.get("MYPY_PLAY_PORT")
if port is not None:
    options.port = int(port)
debug = environ.get("MYPY_PLAY_DEBUG", "")
if debug != "0" and debug.lower() != "false":
    options.debug = True
