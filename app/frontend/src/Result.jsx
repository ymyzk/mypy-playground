import React from 'react';

function Result({ result }) {
  switch (result.status) {
    case 'ready':
      return 'Welcome to mypy Playground!';
    case 'running':
      return 'Running...';
    case 'succeeded':
    {
      const succeeded = (
        <span>
          Succeeded!! (
          { result.result.duration }
          {' '}
          ms)
        </span>
      );
      const failed = (
        <span>
          Failed (exit code:
          {' '}
          { result.result.exit_code }
          )
          (
          { result.result.duration }
          {' '}
          ms)
        </span>
      );
      return (
        <div>
          { result.result.exit_code === 0 ? succeeded : failed }
          <hr />
          <pre>{ result.result.stdout }</pre>
          <pre>{ result.result.stderr }</pre>
        </div>
      );
    }
    case 'failed':
      return `Error: ${result.message}`;
    case 'creating_gist':
      return 'Creating a gist...';
    case 'fetching_gist':
      return 'Fetching a gist...';
    case 'created_gist':
    {
      const { gistUrl, playgroundUrl } = result;
      return (
        <div>
          <span>Gist URL: </span>
          <a href={gistUrl} target="_blank" rel="noopener noreferrer">{gistUrl}</a>
          <br />
          <span>Playground URL: </span>
          <a href={playgroundUrl}>{playgroundUrl}</a>
          <br />
          <hr />
        </div>
      );
    }
    case 'fetched_gist':
      return 'Completed to fetch a Gist!';
    default:
      return `Unexpected error: ${result}`;
  }
}

export default function ResultWrapper({ result }) {
  return (
    <div id="result">
      <Result result={result} />
    </div>
  );
}
