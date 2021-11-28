import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import ReactGA from 'react-ga';

import './App.css';
import Editor from './Editor';
import Header from './Header';
import Result from './Result';
import { runTypecheck } from './api';
import { fetchGist, shareGist } from './gist';
import { parseMessages } from './utils';

export default class App extends Component {
  constructor(props) {
    super(props);

    const context = JSON.parse(document.getElementById('context').textContent);
    this.state = { // eslint-disable-line react/state-in-constructor
      annotations: [],
      config: context.defaultConfig,
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
    const { context } = this.state;

    if (context.ga_tracking_id) {
      ReactGA.initialize(context.ga_tracking_id);
      ReactGA.pageview(window.location.pathname + window.location.search);
    }

    const params = new URLSearchParams(window.location.search);
    // Load configurations
    const diff = {};
    if (params.has('mypy')) {
      diff.mypyVersion = params.get('mypy');
    }
    if (params.has('python')) {
      diff.pythonVersion = params.get('python');
    }
    if (params.has('flags')) {
      // eslint-disable-next-line no-restricted-syntax
      for (const flag of params.get('flags').split(',')) {
        diff[flag] = true;
      }
    }
    this.updateConfig(diff);
    // Load source
    const source = window.localStorage.getItem('source');
    if (source) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({ source });
    }
    // Load gist
    if (params.has('gist')) {
      this.fetchGist(params.get('gist'));
    }
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { config, source } = this.state;

    // Push history when configuration has changed
    const params = new URLSearchParams(window.location.search);
    if (prevState.config !== config) {
      const flags = [];
      Object.entries(config).forEach(([k, v]) => {
        if (k === 'mypyVersion') {
          params.set('mypy', v);
        } else if (k === 'pythonVersion') {
          params.set('python', v);
        } else if (v) {
          flags.push(k);
        }
      });
      if (flags.length > 0) {
        params.set('flags', flags.join(','));
      }
      window.history.pushState({}, '', `?${params.toString()}`);
    }

    if (prevState.source !== source) {
      window.localStorage.setItem('source', source);
    }
  }

  onChange(source) {
    this.setState({ source });
  }

  updateConfig(configDiff) {
    this.setState((prevState) => ({
      config: {
        ...prevState.config,
        ...configDiff,
      },
    }));
  }

  async run() {
    const {
      config,
      source,
    } = this.state;

    this.setState({ result: { status: 'running' } });

    try {
      const result = await runTypecheck({
        ...config, // eslint-disable-line react/no-access-state-in-setstate
        source, // eslint-disable-line react/no-access-state-in-setstate
      });
      this.setState({
        result: { status: 'succeeded', result },
        annotations: parseMessages(result.stdout),
      });
    } catch (error) {
      this.setState({ result: { status: 'failed', message: error } });
    }
  }

  async shareGist() {
    const { source } = this.state;
    this.setState({ result: { status: 'creating_gist' } });
    try {
      const playgroundUrl = new URL(window.location.href);
      const params = new URLSearchParams(playgroundUrl.search);
      const {
        gistId,
        gistUrl,
      } = await shareGist(source);
      params.set('gist', gistId);
      playgroundUrl.search = `?${params.toString()}`;
      this.setState({
        result: {
          status: 'created_gist',
          gistUrl,
          playgroundUrl: playgroundUrl.toString(),
        },
      });
    } catch (error) {
      this.setState({ result: { status: 'failed', message: `Failed to create a gist: ${error}` } });
    }
  }

  async fetchGist(gistId) {
    this.setState({ result: { status: 'fetching_gist' } });
    try {
      const { source } = await fetchGist(gistId);
      this.setState({
        result: {
          status: 'fetched_gist',
        },
        source,
      });
    } catch (error) {
      this.setState({ result: { status: 'failed', message: `Failed to fetch the gist: ${error}` } });
    }
  }

  render() {
    const {
      annotations,
      config,
      context,
      result,
      source,
    } = this.state;
    return (
      <div className="App d-flex flex-flow flex-column vh-100">
        <Header
          context={context}
          config={config}
          status={result.status}
          onGistClick={this.shareGist}
          onRunClick={this.run}
          onConfigChange={this.updateConfig}
        />
        <Editor
          onChange={this.onChange}
          annotations={annotations}
          source={source}
        />
        <Result result={result} />
      </div>
    );
  }
}
