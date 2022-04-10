from abc import ABC, abstractmethod
from dataclasses import dataclass

from typing import Any, Optional


ARGUMENT_FLAGS_NORMAL = (
    "verbose",
    "ignore-missing-imports",
    "show-error-context",
    "stats",
    "inferstats",
    "version",
    "show-traceback",
    "scripts-are-modules",
    "show-column-numbers",
    "show-error-codes",
)

ARGUMENT_FLAGS_STRICT = (
    "allow-redefinition",
    "allow-untyped-globals",
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
    "no-implicit-optional",
    "no-implicit-reexport",
    "local-partial-types",
    "no-strict-optional",
    "no-warn-no-return",
    "strict-equality",
    "warn-incomplete-stub",
    "warn-redundant-casts",
    "warn-return-any",
    "warn-unreachable",
    "warn-unused-configs",
    "warn-unused-ignores",
)

ARGUMENT_FLAGS = ARGUMENT_FLAGS_NORMAL + ARGUMENT_FLAGS_STRICT


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
    async def run_typecheck(
        self,
        source: str,
        /,
        mypy_version: str,
        python_version: Optional[str] = None,
        **kwargs: Any,
    ) -> Optional[Result]:
        pass
