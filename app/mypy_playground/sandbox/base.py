from abc import ABC, abstractmethod
from dataclasses import dataclass

from typing import Any, Optional


ARGUMENT_FLAGS_NORMAL = (
    "verbose",
    "ignore-missing-imports",
    "show-error-context",
    "stats",
    "inferstats",
    "scripts-are-modules",
    "show-column-numbers",
    "show-error-codes",
)

ARGUMENT_FLAGS_STRICT = (
    "strict",
    "check-untyped-defs",
    "disallow-any-decorated",
    "disallow-any-expr",
    "disallow-any-explicit",
    "disallow-any-generics",
    "disallow-any-unimported",
    "disallow-incomplete-defs",
    "disallow-subclassing-any",
    "disallow-untyped-calls",
    "disallow-untyped-decorators",
    "disallow-untyped-defs",
    "no-strict-optional",
    "no-warn-no-return",
    "warn-incomplete-stub",
    "warn-redundant-casts",
    "warn-return-any",
    "warn-unreachable",
    "warn-unused-configs",
    "warn-unused-ignores",
)

ARGUMENT_FLAGS = ARGUMENT_FLAGS_NORMAL + ARGUMENT_FLAGS_STRICT
PYTHON_VERSIONS = ["3.10", "3.9", "3.8", "3.7", "3.6", "3.5", "3.4", "2.7"]


@dataclass
class Result:
    exit_code: int
    stdout: str
    stderr: str
    duration: int  # in millisecond


class AbstractSandbox(ABC):
    @abstractmethod
    def __init__(self) -> None:
        pass

    @abstractmethod
    async def run_typecheck(self,
                            source: str,
                            *,
                            mypy_version: str,
                            python_version: Optional[str] = None,
                            **kwargs: Any) -> Optional[Result]:
        pass
