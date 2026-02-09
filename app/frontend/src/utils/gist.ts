interface GistResponse {
  id: string;
  url: string;
}

export async function shareGist(source: string): Promise<{ gistId: string; gistUrl: string }> {
  const response = await fetch("/api/gist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source }),
  });
  if (response.status !== 201) {
    throw new Error(`Request failed with status ${String(response.status)}`);
  }
  const data = (await response.json()) as GistResponse;
  return {
    gistId: data.id,
    gistUrl: data.url,
  };
}

export async function fetchGist(gistId: string): Promise<{ source: string }> {
  const response = await fetch(`https://gist.githubusercontent.com/mypy-play/${gistId}/raw/main.py`);
  if (response.status !== 200) {
    throw new Error(`Request failed with status ${String(response.status)}`);
  }
  return {
    source: await response.text(),
  };
}
