type Request = Record<string, boolean | string | string[]>;
interface Response {
  exit_code: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export async function runTypecheck(data: Request): Promise<Response> {
  // TODO: Replace with AbortSignal.timeout(30_000) once widely supported by browsers
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log("Typecheck request timed out on the client side");
  }, 30 * 1000);
  try {
    const response = await fetch("/api/typecheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${String(response.status)}`);
    }
    return (await response.json()) as Response;
  } finally {
    clearTimeout(timeoutId);
  }
}
