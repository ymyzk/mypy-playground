import logging
from pathlib import Path
from typing import Any, List

import tornado.ioloop
import tornado.web
from tornado.options import define, options

from . import handlers

logger = logging.getLogger(__name__)
root_dir = Path(__file__).parents[1]
static_dir = root_dir / "static"
templates_dir = root_dir / "static"
# The CrossHair Web Worker is served as-is (not bundled, and not under static/,
# which the frontend build wipes).
worker_dir = root_dir / "worker"

define("ga_tracking_id", default=None, help="Google Analytics tracking ID")
define("github_token", default=None, help="GitHub API token for creating gists")
define("port", default=8080, help="Port number")
define("debug", default=False, help="Debug mode")


def make_app(**kwargs: Any) -> tornado.web.Application:
    # TODO: We can give more precise type to this variable
    #       But it doesn't work well as of mypy 0.700 / tornado 6.0.2
    routes: List[Any] = [
        (r"/worker/(.*)", tornado.web.StaticFileHandler, {"path": str(worker_dir)}),
        (r"/gist", handlers.GistHandler),
        (r"/", handlers.IndexHandler),
    ]
    return tornado.web.Application(
        routes,
        static_path=static_dir,
        template_path=templates_dir,
        debug=options.debug,
        **kwargs
    )
