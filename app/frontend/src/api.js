import axios from 'axios';

// eslint-disable-next-line import/prefer-default-export
export async function runTypecheck(data) {
  const response = await axios.post('/api/typecheck', data, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30 * 1000,
    validateStatus(status) {
      return status === 200;
    },
  });
  return response.data;
}
