import logging
from pathlib import Path
from typing import Any

from tornado.options import define, options
import tornado.web

from mypy_playground import handlers
from mypy_playground.prometheus import PrometheusMixin


logger = logging.getLogger(__name__)
root_dir = Path(__file__).parents[1]
static_dir = root_dir / "static"
templates_dir = root_dir / "static"

define("docker_images",
       default="latest:ymyzk/mypy-playground-sandbox:latest",
       help="Docker image used by DockerSandbox")
define("sandbox", default="mypy_playground.sandbox.docker.DockerSandbox",
       help="Sandbox implementation to use.")
define("sandbox_concurrency", default=3,
       help="The number of running sandboxes at the same time")
define("ga_tracking_id", default=None, help="Google Analytics tracking ID")
define("github_token", default=None,
       help="GitHub API token for creating gists")
define("mypy_versions",
       default="mypy latest:latest",
       help="List of mypy versions used by a sandbox")
define("enable_prometheus", default=False, help="Prometheus metrics endpoint")
define("port", default=8080, help="Port number")
define("debug", default=False, help="Debug mode")


class Application(PrometheusMixin, tornado.web.Application):
    pass


def make_app(**kwargs: Any) -> tornado.web.Application:
    routes: list[tuple[str, type[tornado.web.RequestHandler]]] = [
        (r"/typecheck.json", handlers.TypecheckHandler),
        (r"/gist", handlers.GistHandler),
        (r"/", handlers.IndexHandler),
    ]
    if options.enable_prometheus:
        routes.append((r"/private/metrics", handlers.PrometheusMetricsHandler))
    return Application(
        routes,
        static_path=static_dir,
        template_path=templates_dir,
        debug=options.debug,
        **kwargs)
