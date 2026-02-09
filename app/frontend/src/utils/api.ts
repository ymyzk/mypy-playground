type Request = Record<string, boolean | string | string[]>;
interface Response {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export async function runTypecheck(data: Request): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30 * 1000);

  try {
    const response = await fetch("/api/typecheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = `HTTP ${String(response.status)}`;
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) {
          message = body.message;
        }
      } catch {
        // Use default message if body isn't parseable
      }
      throw new Error(message);
    }
    return (await response.json()) as Response;
  } finally {
    clearTimeout(timeoutId);
  }
}
