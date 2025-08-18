import tomllib
from os import environ
from pathlib import Path
from typing import Any

from tornado.options import options


def _parse_pair_str(config: str) -> tuple[str, str]:
    pair = tuple(config.split(":", 1))
    if len(pair) != 2:
        raise SyntaxError(f"The given string is not a pair: {config}")
    # Already verified the length, so just return the tuple
    return pair


def _parse_pair_list(config: Any) -> tuple[str, str]:
    if not isinstance(config, list):
        raise TypeError(f"The given config is not a list: {config}")
    if len(config) != 2:
        raise TypeError(f"The given list is not a pair: {config}")
    return config[0], config[1]


class DictOption(dict[str, str]):
    """Custom dict[str, str] type for Tornado option

    Input 1: "a:b,c:d"
    Output 1: {"a": "b", "c": "d"}

    Input 2: 123
    Output 2: TypeError
    """

    def __init__(self, config: dict[str, str] | str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair_str(c) for c in config.split(","))
        elif isinstance(config, dict):
            super().__init__((str(k), str(v)) for k, v in config.items())
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")


class ListPairOption(list[tuple[str, str]]):
    def __init__(self, config: list[list[str]] | str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair_str(c) for c in config.split(","))
        elif isinstance(config, list):
            super().__init__(map(_parse_pair_list, config))
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")


def parse_environment_variables() -> None:
    """Load Tornado options from environment variables"""
    for option_name in options._options:
        env_name = option_name.upper().replace("-", "_")
        env_value = environ.get(env_name)
        if env_value is None:
            continue
        option = options._options[option_name]
        option.parse(env_value)


def parse_toml_file(path: Path) -> None:
    """Load Tornado options from TOML file"""
    if not path.is_file():
        return
    with open(path, "rb") as f:
        config = tomllib.load(f)
    for option_name in options._options:
        value = config.get(option_name)
        if value is None:
            continue
        option = options._options[option_name]
        if option.multiple:
            option.parse(",".join(value))
        else:
            option.parse(value)
