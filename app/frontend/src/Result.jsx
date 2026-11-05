import React from 'react';

import { buildCrashIssueUrl, summarizeTraceback } from './report';

function Engine({ engine }) {
  switch (engine.status) {
    case 'loading':
      return <div>Loading CrossHair... ({ engine.text })</div>;
    case 'failed':
      return (
        <div>
          <span>Could not load CrossHair: { engine.message }</span>
          <br />
          <span>Reload the page to try again.</span>
        </div>
      );
    default:
      return null;
  }
}

function Output({ stdout, stderr }) {
  return (
    <div>
      <pre>{ stdout }</pre>
      <pre>{ stderr }</pre>
    </div>
  );
}

function Result({ result, engine }) {
  let message = '';
  switch (result.status) {
    case 'ready':
      return (
        <div>
          <span>This is a web interface for the </span>
          <a href="https://github.com/pschanely/CrossHair">CrossHair</a>
          <span> concolic analysis tool.</span>
          { engine.status === 'ready' && (
            <div className="text-muted">
              CrossHair { engine.crosshairVersion }, Python { engine.pythonVersion }, running in your browser.
            </div>
          ) }
        </div>
      );
    case 'running':
      return (
        <div>
          <div>Running... (press Stop to abandon the analysis; results appear when it finishes)</div>
          <Output stdout={result.stdout} stderr="" />
        </div>
      );
    case 'stopped':
      return (
        <div>
          <div>
            { result.result.stdout
              ? 'Stopped. Counterexamples reported before stopping:'
              : 'Stopped. CrossHair reports results when it finishes, so there is nothing to show.' }
          </div>
          <Output stdout={result.result.stdout} stderr="" />
        </div>
      );
    case 'crashed':
      return (
        <div>
          <div>
            <strong>CrossHair crashed</strong>
            <span>: </span>
            <code>{ summarizeTraceback(result.result.crashed) }</code>
          </div>
          <div>
            <span>This is a bug in CrossHair, not a problem with your code. </span>
            <a
              href={buildCrashIssueUrl({
                source: result.source,
                crashed: result.result.crashed,
                crosshairVersion: engine.crosshairVersion,
                pythonVersion: engine.pythonVersion,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report it
            </a>
            <span> (the report is pre-filled with your code and the traceback).</span>
          </div>
          <hr />
          <Output stdout={result.result.stdout} stderr={result.result.crashed} />
        </div>
      );
    case 'succeeded':
      if (result.result.exit_code === 2) {
        message = <div>CrossHair could not analyze this code:</div>;
      } else if (result.result.exit_code === 0) {
        message = (
          <div>
            <span>No counterexamples found.</span>
            <br />
            <span>Hoping to find something? File a </span>
            <a href="https://github.com/pschanely/CrossHair/issues/new?labels=missed%20bug&template=bug_report.md">missed bug</a>
            <span> report.</span>
          </div>
        );
      } else {
        message = (
          <div>
            <span>Found a problem! </span>
            <span>(Is a counterexample wrong? Please file a </span>
            <a href="https://github.com/pschanely/CrossHair/issues/new?labels=false%20alarm&template=bug_report.md">false alarm</a>
            <span> report!)</span>
          </div>
        );
      }
      return (
        <div>
          { message }
          <hr />
          <Output stdout={result.result.stdout} stderr={result.result.stderr} />
        </div>
      );
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
          <a href={gistUrl} target="_blank" rel="noopener noreferrer">{gistUrl}</a><br />
          <span>Playground URL: </span>
          <a href={playgroundUrl}>{playgroundUrl}</a><br />
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

export default function ResultWrapper({ result, engine }) {
  return (
    <div id="result">
      <Engine engine={engine} />
      <Result result={result} engine={engine} />
    </div>
  );
}
