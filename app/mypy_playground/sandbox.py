from abc import ABC, abstractmethod
from dataclasses import dataclass
from io import BytesIO
import logging
from pathlib import Path
import tarfile
import time
from typing import Any, Dict, Optional

import aiodocker


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
    async def run_typecheck(self,
                            source: str,
                            *,
                            python_version: Optional[str] = None,
                            **kwargs: Any) -> Optional[Result]:
        pass


class DockerSandbox(AbstractSandbox):
    client: aiodocker.Docker
    docker_image: str
    source_file_path: Path

    def __init__(self, docker_image: str) -> None:
        self.client = aiodocker.Docker()
        self.docker_image = docker_image
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
                            python_version: Optional[str] = None,
                            **kwargs: Any
                            ) -> Optional[Result]:
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
                "Image": self.docker_image,
                "Cmd": cmd,
                "HostConfig": {
                    "CapDrop": ["ALL"],
                    "Memory": 128 * 1024 * 1024,
                    "NetworkMode": "none",
                    "PidsLimit": 32,
                    "SecurityOpt": ["no-new-privileges"]
                }
            }
            c = await self.client.containers.create(config=config)
            await c.put_archive(str(self.source_file_path.parent),
                                self.create_archive(source))
            await c.start()
            exit_code = (await c.wait())["StatusCode"]
            stdout = "\n".join(await c.log(stdout=True, stderr=False))
            stderr = "\n".join(await c.log(stdout=False, stderr=True))
            await c.delete()
            duration = int(1000 * (time.time() - start_time))
            logger.info("finished in %d ms", duration)
            return Result(  # type: ignore
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
                duration=duration)
        except aiodocker.exceptions.DockerError as e:
            logger.error(f"docker api error: {e}")
        # TODO: better error handling
        return None
