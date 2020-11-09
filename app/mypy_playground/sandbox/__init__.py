import asyncio
import logging
from typing import Any, Optional

from tornado.options import options

from mypy_playground.sandbox.base import AbstractSandbox, Result


logger = logging.getLogger(__name__)


semaphore: Optional[asyncio.Semaphore] = None


def get_semaphore() -> asyncio.Semaphore:
    # Lazy initialization of the semaphore to use options correctly
    global semaphore
    if not semaphore:
        value = options.sandbox_concurrency
        logger.info("created semaphore for sandbox: concurrency=%d", value)
        semaphore = asyncio.Semaphore(value)
    return semaphore


async def run_typecheck_in_sandbox(sandbox: AbstractSandbox,
                                   source: str,
                                   **kwargs: Any
                                   ) -> Optional[Result]:
    logger.debug("acquiring semaphore")
    async with get_semaphore():
        logger.debug("acquired semaphore")
        return await sandbox.run_typecheck(source, **kwargs)
