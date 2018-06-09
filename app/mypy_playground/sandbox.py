from io import BytesIO
import logging
import tarfile
import time
from typing import Any, Dict, Optional

import aiodocker


DOCKER_IMAGE = "ymyzk/mypy-playground:sandbox"
SOURCE_DIR = "/tmp"
SOURCE_FILE_NAME = "main.py"

ARGUMENT_FLAGS_NORMAL = (
    "verbose",
    "ignore-missing-imports",
    "warn-incomplete-stub",
    "show-error-context",
    "stats",
    "inferstats",
    "scripts-are-modules",
    "show-column-numbers",
)

ARGUMENT_FLAGS_STRICT = (
    "strict",
    "check-untyped-defs",
    "disallow-subclassing-any",
    "disallow-untyped-calls",
    "disallow-untyped-defs",
    "no-strict-optional",
    "no-warn-no-return",
    "warn-redundant-casts",
    "warn-return-any",
    "warn-unused-ignores",
)

ARGUMENT_FLAGS = ARGUMENT_FLAGS_NORMAL + ARGUMENT_FLAGS_STRICT
PYTHON_VERSIONS = ["2.7", "3.3", "3.4", "3.5", "3.6"]

client = aiodocker.Docker()
logger = logging.getLogger(__name__)


class Result:
    def __init__(self,
                 *,
                 exit_code: int,
                 stdout: str,
                 stderr: str) -> None:
        self.exit_code = exit_code
        self.stdout = stdout
        self.stderr = stderr

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
        }


def create_archive(source: str) -> BytesIO:
    stream = BytesIO()
    with tarfile.TarFile(fileobj=stream, mode="w") as tar:
        data = source.encode("utf-8")
        tarinfo = tarfile.TarInfo(name=SOURCE_FILE_NAME)
        tarinfo.size = len(data)
        tarinfo.mtime = int(time.time())
        tar.addfile(tarinfo, BytesIO(data))
    stream.seek(0)
    return stream


async def run_typecheck(source: str,
                        *,
                        python_version: Optional[str] = None,
                        **kwargs: Any
                        ) -> Optional[Result]:
    cmd = ["mypy", "--cache-dir", "/dev/null", "--no-site-packages"]
    if python_version:
        cmd += ["--python-version", f"{python_version}"]
    for key, value in kwargs.items():
        if key in ARGUMENT_FLAGS:
            cmd.append(f"--{key}")
    cmd.append(SOURCE_FILE_NAME)
    try:
        config = {
            "Image": DOCKER_IMAGE,
            "Cmd": cmd,
            "HostConfig": {
                "CapDrop": ["ALL"],
                "Memory": 128 * 1024 * 1024,
                "NetworkMode": "none",
                "PidsLimit": 32,
                "SecurityOpt": ["no-new-privileges"]
            }
        }
        c = await client.containers.create(config=config)
        await c.put_archive(SOURCE_DIR, create_archive(source))
        await c.start()
        exit_code = (await c.wait())["StatusCode"]
        stdout = "\n".join(await c.log(stdout=True, stderr=False))
        stderr = "\n".join(await c.log(stdout=False, stderr=True))
        await c.delete()
        return Result(exit_code=exit_code, stdout=stdout, stderr=stderr)
    except aiodocker.exceptions.DockerError as e:
        logger.error(f"docker api error: {e}")
        return None
    # TODO: better error handling
