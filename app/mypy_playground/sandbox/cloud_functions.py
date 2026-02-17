import time
import urllib.parse
from logging import getLogger
from typing import Any

import google.auth.transport.requests
import google.oauth2.id_token
import httpx

from mypy_playground.config import get_settings
from mypy_playground.sandbox.base import (
    ARGUMENT_FLAGS,
    ARGUMENT_MULTI_SELECT_OPTIONS,
    AbstractSandbox,
    Result,
)

logger = getLogger(__name__)


class CloudFunctionsSandbox(AbstractSandbox):
    def __init__(self) -> None:
        pass

    async def run_typecheck(
        self,
        source: str,
        /,
        mypy_version: str,
        python_version: str | None = None,
        **kwargs: Any,
    ) -> Result | None:
        start_time = time.time()

        function_url = self._get_cloud_function_url(mypy_version)
        if function_url is None:
            logger.error(
                "cannot find a Cloud function for mypy version: %s", mypy_version
            )
            return None

        token = self._get_identity_token(function_url)

        args = ["--cache-dir", "/dev/null", "--no-site-packages"]
        if python_version:
            args += ["--python-version", f"{python_version}"]
        for key, value in kwargs.items():
            if key in ARGUMENT_FLAGS:
                args.append(f"--{key}")
            if key in ARGUMENT_MULTI_SELECT_OPTIONS:
                for v in value:
                    args.append(f"--{key}={v}")

        data = {
            "source": source,
            "options": args,
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "mypy-playground",  # TODO: Better UA w/ version?
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    function_url,
                    json=data,
                    headers=headers,
                )

                if response.status_code != 200:
                    # TODO: better error handling
                    logger.error(
                        "unexpected status code from Cloud Functions: %d",
                        response.status_code,
                    )
                    return None

                res_data = response.json()
                duration = int(1000 * (time.time() - start_time))
                return Result(
                    exit_code=res_data["exit_code"],
                    stdout=res_data["stdout"],
                    stderr=res_data["stderr"],
                    duration=duration,
                )
            except httpx.HTTPError:
                logger.exception("HTTP error during Cloud Functions request")
                return None

    def _get_cloud_function_url(self, mypy_version_id: str) -> str | None:
        settings = get_settings()
        base_url = settings.cloud_functions_url
        if not isinstance(base_url, str):
            return None

        name = settings.cloud_function_names.get(mypy_version_id)
        if not isinstance(name, str):
            return None

        return urllib.parse.urljoin(base_url, name)

    def _get_identity_token(self, url: str) -> str:
        """Get identity token to invoke a Cloud Function.

        1. Get a token given via options (development use).
        2. Use google-auth library to get a token.
        3. Raises an exception if all of the above fails.

        https://cloud.google.com/functions/docs/securing/authenticating
        """
        # 1. Options
        settings = get_settings()
        if isinstance(token := settings.cloud_functions_identity_token, str):
            return token

        # 2. google-auth library
        # Experimental async support
        # https://googleapis.dev/python/google-auth/latest/reference/google.auth.transport._aiohttp_requests.html
        auth_req = google.auth.transport.requests.Request()
        # Get a token or raise an exception
        if isinstance(
            token := google.oauth2.id_token.fetch_id_token(auth_req, url),  # type: ignore[no-untyped-call]
            str,
        ):
            return token

        raise Exception("failed to get identity token")
