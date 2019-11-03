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
    this.state = {
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
    if (this.state.context.ga_tracking_id) {
      ReactGA.initialize(this.state.context.ga_tracking_id);
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
    // Push history when configuration has changed
    const params = new URLSearchParams(window.location.search);
    if (prevState.config !== this.state.config) {
      const flags = [];
      Object.entries(this.state.config).forEach(([k, v]) => {
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

    if (prevState.source !== this.state.source) {
      window.localStorage.setItem('source', this.state.source);
    }
  }

  onChange(source) {
    this.setState({ source });
  }

  updateConfig(configDiff) {
    this.setState({ config: { ...this.state.config, ...configDiff } });
  }

  async run() {
    this.setState({ result: { status: 'running' } });

    try {
      const result = await runTypecheck({
        ...this.state.config,
        source: this.state.source,
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
    this.setState({ result: { status: 'creating_gist' } });
    try {
      const playgroundUrl = new URL(window.location.href);
      const params = new URLSearchParams(playgroundUrl.search);
      const {
        gistId,
        gistUrl,
      } = await shareGist(this.state.source);
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
    return (
      <div className="App">
        <Header
          context={this.state.context}
          config={this.state.config}
          status={this.state.result.status}
          onGistClick={this.shareGist}
          onRunClick={this.run}
          onConfigChange={this.updateConfig}
        />
        <Editor
          onChange={this.onChange}
          annotations={this.state.annotations}
          source={this.state.source}
        />
        <Result result={this.state.result} />
      </div>
    );
  }
}
