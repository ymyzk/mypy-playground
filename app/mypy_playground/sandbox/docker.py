import logging
import tarfile
import time
from io import BytesIO
from pathlib import Path
from typing import Any, Optional, cast

import aiodocker
from tornado.options import define, options

from mypy_playground.sandbox.base import (
    ARGUMENT_FLAGS,
    ARGUMENT_MULTI_SELECT_OPTIONS,
    AbstractSandbox,
    Result,
)
from mypy_playground.utils import DictOption

logger = logging.getLogger(__name__)


define(
    "docker_images",
    type=DictOption,
    default={"latest": "ymyzk/mypy-playground-sandbox:latest"},
    help="Docker image used by DockerSandbox",
)


class DockerSandbox(AbstractSandbox):
    client: aiodocker.Docker
    source_file_path: Path

    def __init__(self) -> None:
        self.client = aiodocker.Docker()
        self.source_file_path = Path("/tmp/main.py")

    async def run_typecheck(
        self,
        source: str,
        /,
        mypy_version: str,
        python_version: Optional[str] = None,
        **kwargs: Any,
    ) -> Optional[Result]:
        start_time = time.time()

        docker_image = self._get_docker_image(mypy_version)
        if docker_image is None:
            logger.error(f"cannot find a docker image for mypy version: {mypy_version}")
            return None

        cmd = ["mypy", "--cache-dir", "/dev/null", "--no-site-packages"]
        if python_version:
            cmd += ["--python-version", f"{python_version}"]
        for key, value in kwargs.items():
            if key in ARGUMENT_FLAGS:
                cmd.append(f"--{key}")
            if key in ARGUMENT_MULTI_SELECT_OPTIONS:
                for v in value:
                    cmd.append(f"--{key}={v}")
        cmd.append(self.source_file_path.name)

        config = {
            "Image": docker_image,
            "Cmd": cmd,
            "HostConfig": {
                "CapDrop": ["ALL"],
                "Memory": 128 * 1024 * 1024,
                "NetworkMode": "none",
                "PidsLimit": 32,
                "SecurityOpt": ["no-new-privileges"],
            },
        }

        # Using Any to suppress type errors around aiodocker
        c: Optional[Any] = None
        try:
            logger.info("creating container")
            c = await self.client.containers.create(config=config)  # type: ignore
            await c.put_archive(  # type: ignore[no-untyped-call]
                str(self.source_file_path.parent), self._create_archive(source)
            )
            await c.start()
            exit_code = (await c.wait())["StatusCode"]
            stdout = "".join(await c.log(stdout=True, stderr=False)).strip()
            stderr = "".join(await c.log(stdout=False, stderr=True)).strip()
            await c.delete()
        except aiodocker.exceptions.DockerError:
            logger.exception("docker api error")
            if c is not None:
                try:
                    logger.info("cleaning up the container: %s", c)
                    await c.delete()
                except aiodocker.exceptions.DockerError:
                    logger.exception("docker api error while cleaning up. ignoring.")
            return None

        duration = int(1000 * (time.time() - start_time))
        logger.info("finished in %d ms", duration)
        return Result(
            exit_code=exit_code,
            stdout=stdout,
            stderr=stderr,
            duration=duration,
        )

    def _create_archive(self, source: str) -> BytesIO:
        stream = BytesIO()
        with tarfile.TarFile(fileobj=stream, mode="w") as tar:
            data = source.encode("utf-8")
            tarinfo = tarfile.TarInfo(name=self.source_file_path.name)
            tarinfo.size = len(data)
            tarinfo.mtime = int(time.time())
            tar.addfile(tarinfo, BytesIO(data))
        stream.seek(0)
        return stream

    def _get_docker_image(self, mypy_version_id: str) -> Optional[str]:
        return cast(DictOption, options.docker_images).get(mypy_version_id)
