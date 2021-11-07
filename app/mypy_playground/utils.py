from functools import lru_cache
from typing import cast

from tornado.options import options


@lru_cache()
def parse_option_as_dict(name: str) -> dict[str, str]:
    # This function assumes that dict is insertion order-preserving
    # (Python 3.7+)
    return dict(
        cast(list[tuple[str, str]],
             [tuple(i.split(":", 1)) for i in options[name].split(",")])
    )


@lru_cache(maxsize=1)
def get_mypy_versions() -> list[tuple[str, str]]:
    return list(parse_option_as_dict("mypy_versions").items())
