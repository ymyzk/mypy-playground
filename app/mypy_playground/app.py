import logging
from pathlib import Path
from typing import Any

import tornado.ioloop
from tornado.options import define, options
import tornado.web

from . import handlers


logger = logging.getLogger(__name__)
root_dir = Path(__file__).parents[1]
static_dir = root_dir / "static"
templates_dir = root_dir / "templates"

define("docker_images",
       default="latest:ymyzk/mypy-playground-sandbox:latest",
       help="Docker image used by DockerSandbox")
define("sandbox_concurrency", default=3,
       help="The number of running sandboxes at the same time")
define("ga_tracking_id", default=None, help="Google Analytics tracking ID")
define("github_token", default=None,
       help="GitHub API token for creating gists")
define("mypy_versions",
       default="mypy latest:latest",
       help="List of mypy versions used by a sandbox")
define("port", default=8080, help="Port number")
define("debug", default=False, help="Debug mode")


def make_app(**kwargs: Any) -> tornado.web.Application:
    routes = [
        (r"/typecheck.json", handlers.TypecheckHandler),
        (r"/gist", handlers.GistHandler),
        (r"/", handlers.IndexHandler),
    ]
    return tornado.web.Application(
        routes,
        static_path=static_dir,
        template_path=templates_dir,
        debug=options.debug,
        **kwargs)
