from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

# The flags we display to the user as options in the "Options" menu.

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
    "enable-recursive-aliases",
    "implicit-optional",
    "new-type-inference",
)

ARGUMENT_FLAGS_STRICT = (
    "allow-redefinition",
    "allow-untyped-globals",
    "strict",
    "strict-bytes",
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
    "no-implicit-reexport",
    "local-partial-types",
    "no-strict-optional",
    "no-warn-no-return",
    "strict-equality",
    "strict-equality-for-none",
    "warn-incomplete-stub",
    "warn-redundant-casts",
    "warn-return-any",
    "warn-unreachable",
    "warn-unused-configs",
    "warn-unused-ignores",
    "extra-checks",
)

ARGUMENT_FLAGS = ARGUMENT_FLAGS_NORMAL + ARGUMENT_FLAGS_STRICT

ARGUMENT_MULTI_SELECT_OPTIONS = {
    # Reference: https://github.com/python/mypy/blob/6427ef17f0180422e0113bc67440d2b911d68f39/mypy/options.py#L74-L81
    "enable-incomplete-feature": (
        "InlineTypedDict",
        "NewGenericSyntax",
        "PreciseTupleTypes",
        "TypeVarTuple",
        "Unpack",
    ),
    # Reference: https://github.com/python/mypy/blob/657154b6748793f44be7b8238b7265c4e84c2e16/mypy/errorcodes.py
    "enable-error-code": (
        "possibly-undefined",
        "redundant-expr",
        "truthy-bool",
        "truthy-iterable",
        "ignore-without-code",
        "unused-awaitable",
        "redundant-self",
        "unused-ignore",
        "explicit-override",
        "unimported-reveal",
        "mutable-override",
        "exhaustive-match",
        "deprecated",
    ),
}


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
        python_version: str | None = None,
        **kwargs: Any,
    ) -> Result | None:
        pass
