from io import BytesIO, StringIO
import tarfile
import time
from typing import Any, Dict, Optional

import docker
from requests.exceptions import ConnectionError

from .utils import setup_logger


DOCKER_IMAGE = "ymyzk/mypy-playground:sandbox"
SOURCE_DIR = "/tmp"
SOURCE_FILE_NAME = "<annon.py>"

ARGUMENT_FLAGS = (
    "verbose",
)

client = docker.from_env()
logger = setup_logger(__name__)


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


def pull_image(force: bool = False) -> None:
    if force:
        client.images.pull(DOCKER_IMAGE)
        return
    try:
        client.images.get(DOCKER_IMAGE)
    except docker.errors.ImageNotFound:
        logger.info("image not found: %s", DOCKER_IMAGE)
        client.images.pull(DOCKER_IMAGE)


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


def run_typecheck(source,
                  *,
                  python_version: Optional[str] = None,
                  **kwargs
                  ) -> Optional[Result]:
    with StringIO() as builder:
        builder.write("mypy --cache-dir /dev/null ")
        if python_version:
            builder.write(f"--python-version {python_version} ")
        for key, value in kwargs.items():
            if key in ARGUMENT_FLAGS:
                builder.write(f"--{key} ")
        builder.write(SOURCE_FILE_NAME)
        cmd = builder.getvalue()  # type: ignore
    try:
        pull_image()
        c = client.containers.create(
                DOCKER_IMAGE,
                command=cmd,
                cap_drop="ALL",
                mem_limit="128m",
                network_mode="none",
                pids_limit=32,
                security_opt=["no-new-privileges"])
        c.put_archive(SOURCE_DIR, create_archive(source))
        c.start()
        exit_code = c.wait()
        stdout = c.logs(stdout=True, stderr=False).decode("utf-8")
        stderr = c.logs(stdout=False, stderr=True).decode("utf-8")
        c.remove()
        return Result(exit_code=exit_code, stdout=stdout, stderr=stderr)
    # TODO: better error handling
    except ConnectionError as e:
        logger.error(f"requests connection error: {e}")
        return None
    except docker.errors.APIError as e:
        logger.error(f"docker api error: {e}")
        return None
