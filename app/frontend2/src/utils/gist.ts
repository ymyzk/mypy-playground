import axios from "axios";

export async function shareGist(source: string): Promise<{ gistId: string; gistUrl: string }> {
  const { data } = await axios.post(
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
  const response = await axios.get(`https://gist.githubusercontent.com/mypy-play/${gistId}/raw/main.py`, {
    validateStatus(status) {
      return status === 200;
    },
  });
  return {
    source: response.data,
  };
}
