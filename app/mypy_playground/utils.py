from functools import lru_cache
from typing import Dict, List, Tuple, cast

from tornado.options import options


@lru_cache()
def parse_option_as_dict(name: str) -> Dict[str, str]:
    # This function assumes that dict is insertion order-preserving
    # (Python 3.7+)
    return dict(
        cast(List[Tuple[str, str]],
             [tuple(i.split(":", 1)) for i in options[name].split(",")])
    )


@lru_cache(maxsize=1)
def get_mypy_versions() -> List[Tuple[str, str]]:
    return list(parse_option_as_dict("mypy_versions").items())
