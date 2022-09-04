from abc import ABC, abstractmethod
from dataclasses import dataclass

from typing import Any




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
        tool_selection: str,
        tool_version: str,
        python_version: str | None = None,
        **kwargs: Any,
    ) -> Result | None:
        pass
