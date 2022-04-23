from typing import Any, cast


def _parse_pair_str(config: str) -> tuple[str, str]:
    pair = tuple(config.split(":", 1))
    if len(pair) != 2:
        raise SyntaxError(f"The given string is not a pair: {config}")
    # It's safe to cast as we already verified the length
    return cast(tuple[str, str], pair)


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
