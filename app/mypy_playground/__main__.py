import logging
from os import environ

import tornado.ioloop
from tornado.options import options, parse_command_line

from .app import make_app


def load_config() -> None:
    parse_command_line()

    options.ga_tracking_id = environ.get("MYPY_PLAY_GA_TRACKING_ID")
    options.github_token = environ.get("MYPY_PLAY_GITHUB_TOKEN")
    port = environ.get("MYPY_PLAY_PORT")
    if port is not None:
        options.port = int(port)
    debug = environ.get("MYPY_PLAY_DEBUG", "")
    if debug != "0" and debug.lower() != "false":
        options.debug = True


load_config()
logger = logging.getLogger(__name__)
app = make_app()
logger.info("starting")
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
