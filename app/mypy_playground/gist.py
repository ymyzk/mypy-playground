import json

from tornado.httpclient import AsyncHTTPClient
from tornado.options import options


API_ENDPOINT = "https://api.github.com/gists"


async def create_gist(source: str) -> dict[str, str] | None:
    data = {
        "description": "Shared via mypy Playground",
        "public": True,
        "files": {"main.py": {"content": source}},
    }
    headers = {
        "Authorization": f"token {options.github_token}",
        "Content-Type": "application/json",
        "User-Agent": "mypy-playground",  # TODO: Better UA w/ version?
    }

    client = AsyncHTTPClient()
    res = await client.fetch(
        API_ENDPOINT,
        method="POST",
        headers=headers,
        body=json.dumps(data),
        raise_error=False,
    )

    if res.code != 201:
        # TODO: better error handling
        return None

    res_data = json.loads(res.body)
    result = {
        "id": res_data["id"],
        "url": res_data["html_url"],
        "source": source,  # NOTE: We should obtain from response?
    }

    return result
