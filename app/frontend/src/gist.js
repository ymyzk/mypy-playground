import axios from 'axios';

export async function shareGist(source) {
  const response = await axios.post('/gist', { source });
  if (response.status !== 201) {
    throw new Error(`Unexpected status code: ${response.status}`);
  }
  return {
    gistUrl: response.data.url,
    playgroundUrl: `https://play-mypy.ymyzk.com/?gist=${response.data.id}`,
  };
}

export async function fetchGist(gistId) {
  const response = await axios.get(`https://api.github.com/gists/${gistId}`);
  if (response.status !== 200) {
    throw new Error(`Cannot fetch the gist with ID: ${gistId}`);
  }
  if (!('main.py' in response.data.files)) {
    throw new Error('"main.py" not found');
  }
  return {
    source: response.data.files['main.py'].content,
  };
}
