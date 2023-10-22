import axios from "axios";

type Request = { [key: string]: any };
type Response = {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration: number;
};

export async function runTypecheck(data: Request): Promise<Response> {
  const response = await axios.post("/api/typecheck", data, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30 * 1000,
    validateStatus(status) {
      return status === 200;
    },
  });
  return response.data;
}
