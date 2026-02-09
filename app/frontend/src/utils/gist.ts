import axios from "axios";

interface GistResponse {
  id: string;
  url: string;
}

export async function shareGist(source: string): Promise<{ gistId: string; gistUrl: string }> {
  const { data } = await axios.post<GistResponse>(
    "/api/gist",
    { source },
    {
      validateStatus(status) {
        return status === 201;
      },
    },
  );
  return {
    gistId: data.id,
    gistUrl: data.url,
  };
}

export async function fetchGist(gistId: string): Promise<{ source: string }> {
  const response = await axios.get<string>(`https://gist.githubusercontent.com/mypy-play/${gistId}/raw/main.py`, {
    validateStatus(status) {
      return status === 200;
    },
  });
  return {
    source: response.data,
  };
}
