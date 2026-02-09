import httpx

from mypy_playground.config import get_settings

API_ENDPOINT = "https://api.github.com/gists"


async def create_gist(source: str) -> dict[str, str] | None:
    """Create a GitHub gist with the provided source code"""
    settings = get_settings()

    data = {
        "description": "Shared via mypy Playground",
        "public": True,
        "files": {"main.py": {"content": source}},
    }
    headers = {
        "Authorization": f"token {settings.github_token}",
        "Content-Type": "application/json",
        "User-Agent": "mypy-playground",  # TODO: Better UA w/ version?
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                API_ENDPOINT,
                json=data,
                headers=headers,
            )

            if response.status_code != 201:
                # TODO: better error handling
                return None

            res_data = response.json()
            result = {
                "id": res_data["id"],
                "url": res_data["html_url"],
                "source": source,  # NOTE: We should obtain from response?
            }

            return result
        except httpx.HTTPError:
            # TODO: better error handling
            return None
