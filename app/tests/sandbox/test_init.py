import asyncio

import pytest
from pytest_mock import MockerFixture

from mypy_playground.sandbox import run_typecheck_in_sandbox


@pytest.mark.gen_test
async def test_run_typecheck_in_sandbox(mocker: MockerFixture) -> None:
    semaphore = asyncio.Semaphore(1)
    mock_sandbox = mocker.AsyncMock()
    await run_typecheck_in_sandbox(
        mock_sandbox, "import this", semaphore=semaphore, python_version="3.8"
    )
    mock_sandbox.run_typecheck.assert_called_once_with(
        "import this", python_version="3.8"
    )
