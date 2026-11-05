import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import ReactGA from 'react-ga';

import './App.css';
import Editor from './Editor';
import Header from './Header';
import Result from './Result';
import CrossHairRunner from './runner';
import { buildArgs, configFromParams, defaultConfig, writeConfigToParams } from './config';
import { fetchGist, shareGist } from './gist';
import { parseMessages } from './utils';

export default class App extends Component {
  constructor(props) {
    super(props);

    const context = JSON.parse(document.getElementById('context').textContent);
    this.state = {
      annotations: [],
      config: defaultConfig(),
      context,
      engine: { status: 'loading', text: 'Starting...' },
      source: context.initial_code,
      result: {
        status: 'ready',
      },
    };

    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.shareGist = this.shareGist.bind(this);
    this.onChange = this.onChange.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
  }

  componentDidMount() {
    if (this.state.context.ga_tracking_id) {
      ReactGA.initialize(this.state.context.ga_tracking_id);
      ReactGA.pageview(window.location.pathname + window.location.search);
    }

    // Starts downloading CrossHair right away, while the user reads and edits.
    this.runner = new CrossHairRunner();
    this.unsubscribe = this.runner.subscribe(engine => this.setState({ engine }));

    const params = new URLSearchParams(window.location.search);
    // Load configurations
    this.updateConfig(configFromParams(params));

    // Load source
    if (params.has('source')) {
      this.setState({ source: params.get('source') });
    } else if (params.has('gist')) {
      this.fetchGist(params.get('gist'));
    } else {
      const source = window.localStorage.getItem('source');
      if (source) {
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState({ source });
      }
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.runner.dispose();
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps, prevState, snapshot) {
    // Push history when configuration has changed
    if (prevState.config !== this.state.config) {
      const params = new URLSearchParams(window.location.search);
      writeConfigToParams(params, this.state.config);
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
    const { source } = this.state;
    this.setState({ result: { status: 'running', stdout: '' }, annotations: [] });

    try {
      const result = await this.runner.run(
        source,
        buildArgs(this.state.config),
        // Show counterexamples as they are found.
        stdout => this.setState({
          result: { status: 'running', stdout },
          annotations: parseMessages(stdout),
        }),
      );
      let status = 'succeeded';
      if (result.stopped) {
        status = 'stopped';
      } else if (result.crashed) {
        status = 'crashed';
      }
      this.setState({
        result: { status, result, source },
        annotations: parseMessages(result.stdout),
      });
    } catch (error) {
      this.setState({ result: { status: 'failed', message: error.message } });
    }
  }

  stop() {
    this.runner.stop();
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
          engineStatus={this.state.engine.status}
          onGistClick={this.shareGist}
          onRunClick={this.run}
          onStopClick={this.stop}
          onConfigChange={this.updateConfig}
        />
        <Editor
          onChange={this.onChange}
          annotations={this.state.annotations}
          source={this.state.source}
        />
        <Result result={this.state.result} engine={this.state.engine} />
      </div>
    );
  }
}
