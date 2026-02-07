import { render, screen } from "@testing-library/react";

import Result from "./Result";
import type { AppResult } from "./types";

describe("Result", () => {
  test("renders when result is ready", () => {
    const result: AppResult = {
      status: "ready",
    };

    render(<Result result={result} />);

    expect(screen.getByText("Welcome to mypy Playground!")).toBeInTheDocument();
  });

  test("renders when result is running", () => {
    const result: AppResult = {
      status: "running",
    };

    render(<Result result={result} />);

    expect(screen.getByText("Running...")).toBeInTheDocument();
  });

  test("renders when result is succeeded with zero exit code", () => {
    const result: AppResult = {
      status: "succeeded",
      result: {
        exit_code: 0,
        duration: 123,
        stdout: "stdout",
        stderr: "stderr",
      },
    };

    render(<Result result={result} />);

    expect(screen.getByText(/Succeeded!!/)).toBeInTheDocument();
    expect(screen.getByText(/123 ms/)).toBeInTheDocument();
    expect(screen.getByText("stdout")).toBeInTheDocument();
    expect(screen.getByText("stderr")).toBeInTheDocument();
  });

  test("renders when result is succeeded with non-zero exit code", () => {
    const result: AppResult = {
      status: "succeeded",
      result: {
        exit_code: 1,
        duration: 123,
        stdout: "stdout",
        stderr: "stderr",
      },
    };

    render(<Result result={result} />);

    expect(screen.getByText(/Failed/)).toBeInTheDocument();
    expect(screen.getByText(/exit code: 1/)).toBeInTheDocument();
    expect(screen.getByText(/123 ms/)).toBeInTheDocument();
    expect(screen.getByText("stdout")).toBeInTheDocument();
    expect(screen.getByText("stderr")).toBeInTheDocument();
  });

  test("renders when creating a gist", () => {
    const result: AppResult = {
      status: "creating_gist",
    };

    render(<Result result={result} />);

    expect(screen.getByText("Creating a gist...")).toBeInTheDocument();
  });

  test("renders when fetching a gist", () => {
    const result: AppResult = {
      status: "fetching_gist",
    };

    render(<Result result={result} />);

    expect(screen.getByText("Fetching a gist...")).toBeInTheDocument();
  });

  test("renders when created a gist", () => {
    const result: AppResult = {
      status: "created_gist",
      gistUrl: "https://example.com/gist",
      playgroundUrl: "https://example.com/mypy-play?gist=abc",
    };

    render(<Result result={result} />);

    // TODO: Improve assertion of links
    expect(screen.getByText("Gist URL:")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /https:\/\/example\.com\/gist/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Playground URL:")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /https:\/\/example\.com\/mypy-play\?gist=abc/i,
      }),
    ).toBeInTheDocument();
  });
});
