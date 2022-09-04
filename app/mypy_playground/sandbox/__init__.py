import asyncio
import logging
from typing import Any

from tornado.options import options

from mypy_playground.sandbox.base import AbstractSandbox, Result


logger = logging.getLogger(__name__)


semaphore: asyncio.Semaphore | None = None


def _get_semaphore() -> asyncio.Semaphore:
    # Lazy initialization of the semaphore to use options correctly
    global semaphore
    if not semaphore:
        value = options.sandbox_concurrency
        logger.info("created semaphore for sandbox: concurrency=%d", value)
        semaphore = asyncio.Semaphore(value)
    return semaphore


async def run_typecheck_in_sandbox(
    sandbox: AbstractSandbox,
    source: str,
    semaphore: asyncio.Semaphore | None = None,
    **kwargs: Any
) -> Result | None:
    if semaphore is None:
        logger.debug("using the default semaphore")
        semaphore = _get_semaphore()

    logger.debug("acquiring semaphore")
    async with semaphore:
        logger.debug("acquired semaphore")
        return await sandbox.run_typecheck(source, **kwargs)
