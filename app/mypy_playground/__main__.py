import logging
from pathlib import Path

import tornado.ioloop
from tornado.options import options, parse_command_line

from mypy_playground.app import make_app
from mypy_playground.utils import parse_environment_variables, parse_toml_file


def load_config() -> None:
    parse_toml_file(Path("config.toml"))
    parse_environment_variables()
    parse_command_line()


load_config()
logger = logging.getLogger(__name__)
app = make_app()
logger.info("starting")
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
