from os import environ

import tornado.ioloop
from tornado.options import define, options, parse_command_line

from .app import make_app


def load_config() -> None:
    parse_command_line()
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


load_config()
app = make_app()
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
