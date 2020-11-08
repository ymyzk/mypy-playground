from abc import ABC, abstractmethod
import asyncio
from dataclasses import dataclass
from io import BytesIO
import logging
from pathlib import Path
import tarfile
import time
from typing import Any, Dict, Optional

import aiodocker
from tornado.options import options

from mypy_playground.utils import parse_option_as_dict


ARGUMENT_FLAGS_NORMAL = (
    "verbose",
    "ignore-missing-imports",
    "show-error-context",
    "stats",
    "inferstats",
    "scripts-are-modules",
    "show-column-numbers",
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
PYTHON_VERSIONS = ["3.9", "3.8", "3.7", "3.6", "3.5", "3.4", "2.7"]

logger = logging.getLogger(__name__)


@dataclass
class Result:
    exit_code: int
    stdout: str
    stderr: str
    duration: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "duration": self.duration,
        }


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


class DockerSandbox(AbstractSandbox):
    client: aiodocker.Docker
    source_file_path: Path

    def __init__(self) -> None:
        self.client = aiodocker.Docker()
        self.source_file_path = Path("/tmp/main.py")

    def create_archive(self, source: str) -> BytesIO:
        stream = BytesIO()
        with tarfile.TarFile(fileobj=stream, mode="w") as tar:
            data = source.encode("utf-8")
            tarinfo = tarfile.TarInfo(name=self.source_file_path.name)
            tarinfo.size = len(data)
            tarinfo.mtime = int(time.time())
            tar.addfile(tarinfo, BytesIO(data))
        stream.seek(0)
        return stream

    async def run_typecheck(self,
                            source: str,
                            *,
                            mypy_version: str,
                            python_version: Optional[str] = None,
                            **kwargs: Any
                            ) -> Optional[Result]:
        docker_image = self.get_docker_image(mypy_version)
        if docker_image is None:
            logger.error(f"cannot find a docker image for mypy version: {mypy_version}")
            return None

        cmd = ["mypy", "--cache-dir", "/dev/null", "--no-site-packages"]
        if python_version:
            cmd += ["--python-version", f"{python_version}"]
        for key, value in kwargs.items():
            if key in ARGUMENT_FLAGS:
                cmd.append(f"--{key}")
        cmd.append(self.source_file_path.name)
        try:
            start_time = time.time()
            logger.info("creating container")
            config = {
                "Image": docker_image,
                "Cmd": cmd,
                "HostConfig": {
                    "CapDrop": ["ALL"],
                    "Memory": 128 * 1024 * 1024,
                    "NetworkMode": "none",
                    "PidsLimit": 32,
                    "SecurityOpt": ["no-new-privileges"]
                }
            }
            c = await self.client.containers.create(config=config)  # type: ignore
            await c.put_archive(str(self.source_file_path.parent),
                                self.create_archive(source))
            await c.start()
            exit_code = (await c.wait())["StatusCode"]
            stdout = "".join(await c.log(stdout=True, stderr=False)).strip()
            stderr = "".join(await c.log(stdout=False, stderr=True)).strip()
            await c.delete()
            duration = int(1000 * (time.time() - start_time))
            logger.info("finished in %d ms", duration)
            return Result(
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
                duration=duration)
        except aiodocker.exceptions.DockerError as e:
            logger.error(f"docker api error: {e}")
        # TODO: better error handling
        return None

    def get_docker_image(self, mypy_version_id: str) -> Optional[str]:
        return parse_option_as_dict("docker_images").get(mypy_version_id)


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
    with await get_semaphore():
        logger.debug("acquired semaphore")
        return await sandbox.run_typecheck(source, **kwargs)
