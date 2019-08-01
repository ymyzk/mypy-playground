import axios from 'axios';

export async function shareGist(source) {
  const response = await axios.post('/gist', { source }, {
    validateStatus(status) {
      return status === 201;
    },
  });
  return {
    gistUrl: response.data.url,
    playgroundUrl: `https://play-mypy.ymyzk.com/?gist=${response.data.id}`,
  };
}

export async function fetchGist(gistId) {
  const response = await axios.get(`https://api.github.com/gists/${gistId}`, {
    validateStatus(status) {
      return status === 200;
    },
  });
  if (!('main.py' in response.data.files)) {
    throw new Error('"main.py" not found');
  }
  return {
    source: response.data.files['main.py'].content,
  };
}
