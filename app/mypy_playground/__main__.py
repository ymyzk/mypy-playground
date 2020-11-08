import logging
from os import environ

import tornado.ioloop
from tornado.options import options, parse_command_line

from mypy_playground.app import make_app


def parse_environment_variables() -> None:
    for option_name in options._options:
        env_name = option_name.upper().replace("-", "_")
        env_value = environ.get(env_name)
        if env_value is None:
            continue
        option = options._options[option_name]
        option.parse(env_value)


def load_config() -> None:
    parse_command_line()
    parse_environment_variables()


load_config()
logger = logging.getLogger(__name__)
app = make_app()
logger.info("starting")
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
