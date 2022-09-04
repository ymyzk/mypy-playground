import json
import urllib.parse
from logging import getLogger
import time
from typing import Any

import google.auth.transport.requests
import google.oauth2.id_token
from tornado.httpclient import AsyncHTTPClient
from tornado.options import define, options

from mypy_playground.sandbox.base import AbstractSandbox, Result
from ..tools.mypy import ARGUMENT_FLAGS
from mypy_playground.utils import DictOption

logger = getLogger(__name__)


# https://cloud.google.com/functions/docs/securing/authenticating#authenticating_developer_testing
define(
    "cloud_functions_base_url",
    type=str,
    default=None,
    help=(
        "URL of Cloud Functions without function name. "
        "Example: https://<region>-<project>.cloudfunctions.net/"
    ),
)
define(
    "cloud_functions_identity_token",
    type=str,
    default=None,
    help=(
        "Identity token used by CloudFunctionsSandbox. "
        "This is mainly for local development."
    ),
)
define(
    "cloud_functions_names",
    type=DictOption,
    default={"latest": "mypy-latest"},
    help="Map from mypy version ID to name of Cloud Functions",
)


class CloudFunctionsSandbox(AbstractSandbox):
    def __init__(self) -> None:
        super().__init__()

    async def run_typecheck(
        self,
        source: str,
        /,
        tool_selection: str,
        tool_version: str,
        python_version: str | None = None,
        **kwargs: Any,
    ) -> Result | None:
        start_time = time.time()

        function_url = self._get_cloud_function_url(tool_version)
        if function_url is None:
            logger.error(
                f"cannot find a Cloud function for {tool_selection} version: {tool_version}"
            )
            return None

        token = self._get_identity_token(function_url)

        args = ["--cache-dir", "/dev/null", "--no-site-packages"]
        if python_version:
            args += ["--python-version", f"{python_version}"]
        for key, value in kwargs.items():
            if key in ARGUMENT_FLAGS:
                args.append(f"--{key}")

        data = {
            "source": source,
            "options": args,
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "mypy-playground",  # TODO: Better UA w/ version?
        }

        client = AsyncHTTPClient()
        res = await client.fetch(
            function_url,
            method="POST",
            headers=headers,
            body=json.dumps(data),
            raise_error=False,
        )
        if res.code != 200:
            # TODO: better error handling
            logger.error("unexpected status code from Cloud Functions: %d", res.code)
            return None
        res_data = json.loads(res.body)
        duration = int(1000 * (time.time() - start_time))
        return Result(
            exit_code=res_data["exit_code"],
            stdout=res_data["stdout"],
            stderr=res_data["stderr"],
            duration=duration,
        )

    def _get_cloud_function_url(self, mypy_version_id: str) -> str | None:
        base_url = options["cloud_functions_base_url"]
        if not isinstance(base_url, str):
            return None

        name = options.cloud_functions_names.get(mypy_version_id)
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
        if isinstance(token := options["cloud_functions_identity_token"], str):
            return token

        # 2. google-auth library
        # Experimental async support
        # https://googleapis.dev/python/google-auth/latest/reference/google.auth.transport._aiohttp_requests.html
        auth_req = google.auth.transport.requests.Request()
        # Get a token or raise an exception
        if isinstance(
            token := google.oauth2.id_token.fetch_id_token(auth_req, url), str
        ):
            return token

        raise Exception("failed to get identity token")
