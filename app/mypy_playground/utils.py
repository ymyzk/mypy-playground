from typing import cast


def _parse_pair(config: str) -> tuple[str, str]:
    pair = tuple(config.split(":", 1))
    if len(pair) != 2:
        raise SyntaxError(f"The given string is not a pair: {config}")
    # It's safe to cast as we already verified the length
    return cast(tuple[str, str], pair)


class DictOption(dict[str, str]):
    """Custom dict[str, str] type for Tornado option

    Input 1: "a:b,c:d"
    Output 1: {"a": "b", "c": "d"}

    Input 2: 123
    Output 2: TypeError
    """

    def __init__(self, config: str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair(c) for c in config.split(","))
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")


class ListPairOption(list[tuple[str, str]]):
    def __init__(self, config: str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair(c) for c in config.split(","))
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")
