import tarfile

import pytest

from mypy_playground.sandbox.docker import DockerSandbox


SAMPLE_CODE = """
import this
print(this.__name__)
"""


@pytest.mark.gen_test
async def test_create_archive() -> None:
    sandbox = DockerSandbox()
    tar_bytes = sandbox._create_archive(SAMPLE_CODE)
    with tarfile.open(fileobj=tar_bytes, mode="r") as tar:
        members = tar.getmembers()
        assert len(members) == 1
        member = members[0]
        assert member.name == "main.py"
        assert member.size == len(SAMPLE_CODE.encode())
        extracted = tar.extractfile(member)
        assert extracted is not None
        assert extracted.read().decode() == SAMPLE_CODE
