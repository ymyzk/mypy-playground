import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Component } from 'react';
import ReactGA from 'react-ga';

import Editor from './Editor';
import Header from './Header';
import './App.css';

function parseMessages(messages) {
  const types = {
    error: 'error',
    note: 'info',
  };
  const getType = (level) => {
    const type = types[level];
    return type || 'error';
  };
  const matcher = /^main\.py:(\d+): (\w+): (.+)/;
  return messages.split('\n').map((m) => {
    const match = m.match(matcher);
    return match ? {
      row: match[1] - 1,
      type: getType(match[2]),
      text: match[3],
    } : null;
  }).filter(m => m !== null);
}

export default class App extends Component {
  constructor(props) {
    super(props);

    const context = JSON.parse(document.getElementById('context').textContent);
    const config = {
      mypyVersion: 'latest',
      pythonVersion: '3.7',
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const flag of context.flags_normal) {
      config[flag] = false;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const flag of context.flags_strict) {
      config[flag] = false;
    }
    this.state = {
      annotations: [],
      config,
      context,
      source: context.initial_code,
      result: {
        status: 'ready',
      },
    };

    this.run = this.run.bind(this);
    this.shareGist = this.shareGist.bind(this);
    this.onChange = this.onChange.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
  }

  componentDidMount() {
    if (this.state.context.ga_tracking_id) {
      ReactGA.initialize(this.state.context.ga_tracking_id);
      ReactGA.pageview(window.location.pathname + window.location.search);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('gist')) {
      this.fetchGist(params.get('gist'));
    }
  }

  onChange(source) {
    this.setState({ source });
  }

  updateConfig(configDiff) {
    this.setState({ config: { ...this.state.config, ...configDiff } });
  }

  run() {
    const data = {
      ...this.state.config,
      source: this.state.source,
    };
    this.setState({ result: { status: 'running' } });

    axios.post('/typecheck.json', data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30 * 1000,
      validateStatus(status) {
        return status === 200;
      },
    }).then((response) => {
      const result = response.data;
      this.setState({
        result: { status: 'succeeded', result },
        annotations: parseMessages(result.stdout),
      });
    }).catch((error) => {
      this.setState({ result: { status: 'failed', message: error } });
    });
  }

  shareGist() {
    const data = {
      source: this.state.source,
    };

    this.setState({ result: { status: 'creating_gist' } });

    axios.post('/gist', data)
      .then((response) => {
        if (response.status !== 201) {
          this.setState({ result: { status: 'failed', message: `Failed to create a gist. Status code: ${response.status}` } });
          return;
        }
        const gistUrl = response.data.url;
        const playgroundUrl = `https://play-mypy.ymyzk.com/?gist=${response.data.id}`;
        this.setState({
          result: {
            status: 'created_gist',
            gistUrl,
            playgroundUrl,
          },
        });
      })
      .catch((error) => {
        this.setState({ result: { status: 'failed', message: `Failed to create a gist. Status code: ${error}` } });
      });
  }

  fetchGist(gistId) {
    this.setState({ result: { status: 'fetching_gist' } });

    axios.get(`https://api.github.com/gists/${gistId}`)
      .then((response) => {
        if (response.status !== 200) {
          this.setState({ result: { status: 'failed', message: 'Failed to fetch the gist.' } });
          return;
        }
        if (!('main.py' in response.data.files)) {
          this.setState({ result: { status: 'failed', message: '"main.py" not found.' } });
          return;
        }

        this.setState({
          source: response.data.files['main.py'].content,
          result: {
            status: 'fetched_gist',
          },
        });
      })
      .catch((error) => {
        this.setState({ result: { status: 'failed', message: `Failed to fetch the gist: ${error}` } });
      });
  }
  render() {
    let result;
    switch (this.state.result.status) {
      case 'ready':
        result = 'Welcome to mypy Playground!';
        break;
      case 'running':
        result = 'Running...';
        break;
      case 'succeeded':
        result = (
          <div>
            {
              this.state.result.result.exit_code === 0 ?
                <span>Succeeded!! ({ this.state.result.result.duration } ms)</span> :
                <span>
                Failed (exit code: { this.state.result.result.exit_code })
                ({ this.state.result.result.duration } ms)
                </span>
            }
            <hr />
            <pre>{ this.state.result.result.stdout }</pre>
            <pre>{ this.state.result.result.stderr }</pre>
          </div>
        );
        break;
      case 'failed':
        result = `Error: ${this.state.result.message}`;
        break;
      case 'creating_gist':
        result = 'Creating a gist...';
        break;
      case 'fetching_gist':
        result = 'Fetching a gist...';
        break;
      case 'created_gist':
      {
        const { gistUrl, playgroundUrl } = this.state.result;
        result = (
          <div>
            <span>Gist URL: </span>
            <a href={gistUrl} target="_blank" rel="noopener noreferrer">{gistUrl}</a><br />
            <span>Playground URL: </span>
            <a href={playgroundUrl}>{playgroundUrl}</a><br />
            <hr />
          </div>
        );
        break;
      }
      case 'fetched_gist':
        result = 'Completed to fetch a Gist!';
        break;
      default:
        console.error('Unexpected case', this.state.result.status);
    }

    return (
      <div className="App">
        <Header
          context={this.state.context}
          status={this.state.result.status}
          onGistClick={this.shareGist}
          onRunClick={this.run}
          onConfigChange={this.updateConfig}
        />
        <Editor
          annotations={this.state.annotations}
          initialCode={this.state.context.initial_code}
          onChange={this.onChange}
          code={this.state.source}
        />
        <div id="result">
          {result}
        </div>
      </div>
    );
  }
}
