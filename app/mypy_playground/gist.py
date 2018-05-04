from typing import Dict, Optional

import requests
from tornado.options import options


API_ENDPOINT = "https://api.github.com/gists"


def create_gist(source: str) -> Optional[Dict[str, str]]:
    data = {
      "description": "Shared via mypy Playground",
      "public": True,
      "files": {
        "main.py": {
          "content": source
        }
      }
    }

    headers = {
        "Authorization": f"token {options.github_token}"
    }

    res = requests.post(API_ENDPOINT, json=data, headers=headers)

    if res.status_code != 201:
        # TODO: better error handling
        return None

    res_data = res.json()
    result = {
        "id": res_data["id"],
        "url": res_data["html_url"],
        "source": source  # NOTE: We should obtain from response?
    }

    return result
