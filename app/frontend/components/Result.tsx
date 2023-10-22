import React from "react";

import styles from "./Result.module.css";

type Props = {
  result: {
    status: string;
    message?: string;
    result?: any;
    gistUrl?: string;
    playgroundUrl?: string;
  };
};

function Result({ result }: Props): JSX.Element {
  switch (result.status) {
    case "ready":
      return <span>Welcome to mypy Playground!</span>;
    case "running":
      return <span>Running...</span>;
    case "succeeded": {
      const succeeded = <span>Succeeded!! ({result.result.duration} ms)</span>;
      const failed = (
        <span>
          Failed (exit code: {result.result.exit_code}) ({result.result.duration} ms)
        </span>
      );
      return (
        <div>
          {result.result.exit_code === 0 ? succeeded : failed}
          <hr />
          <pre>{result.result.stdout}</pre>
          <pre>{result.result.stderr}</pre>
        </div>
      );
    }
    case "failed":
      return <span>Error: {result.message}</span>;
    case "creating_gist":
      return <span>Creating a gist...</span>;
    case "fetching_gist":
      return <span>Fetching a gist...</span>;
    case "created_gist": {
      const { gistUrl, playgroundUrl } = result;
      return (
        <div>
          <span>Gist URL: </span>
          <a href={gistUrl} target="_blank" rel="noopener noreferrer">
            {gistUrl}
          </a>
          <br />
          <span>Playground URL: </span>
          <a href={playgroundUrl}>{playgroundUrl}</a>
          <br />
          <hr />
        </div>
      );
    }
    case "fetched_gist":
      return <span>Successfully loaded the Gist!</span>;
    default:
      return <span>Unexpected error: {JSON.stringify(result)}</span>;
  }
}

export default function ResultWrapper({ result }: Props): JSX.Element {
  return (
    <div className={styles.result}>
      <Result result={result} />
    </div>
  );
}
