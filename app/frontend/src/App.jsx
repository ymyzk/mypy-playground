import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Component } from 'react';
import ReactGA from 'react-ga';
import {
  Button,
  Collapse,
  Form,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarToggler,
} from 'reactstrap';

import Editor from './Editor';
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

function parseQueryParameters() {
  const a = window.location.search.substr(1).split('&');
  if (a === '') return {};
  const b = {};
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < a.length; i++) {
    const p = a[i].split('=');
    // eslint-disable-next-line no-continue
    if (p.length !== 2) continue;
    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
  }
  return b;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.aboutToggle = this.aboutToggle.bind(this);
    this.toggle = this.toggle.bind(this);
    this.optionsToggle = this.optionsToggle.bind(this);
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

    const queries = parseQueryParameters();
    if ('gist' in queries) {
      this.fetchGist(queries.gist);
    }
  }

  onChange(source) {
    this.setState({ source });
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  }

  aboutToggle() {
    this.setState({
      aboutIsOpen: !this.state.aboutIsOpen,
    });
  }

  optionsToggle() {
    this.setState({
      optionsIsOpen: !this.state.optionsIsOpen,
    });
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
        <header>
          <Navbar dark expand="lg">
            <NavbarBrand href="/" className="h1 mb-0">mypy Playground</NavbarBrand>
            <NavbarToggler onClick={this.toggle} />
            <Collapse navbar isOpen={this.state.isOpen}>
              <Form className="form-inline my-2 my-lg-0 mr-auto">
                <button type="button" className="btn btn-light my-2 my-sm-0 mr-sm-2" id="run" disabled={this.state.result.status === 'running'} onClick={this.run}>Run</button>
                <button type="button" className="btn btn-light my-2 my-sm-0 mr-sm-2" id="gist" disabled={this.state.result.status === 'creating_gist'} onClick={this.shareGist}>Gist</button>
                <select className="form-control mr-sm-2" id="mypy_version" title="mypy Version" defaultValue="latest" onChange={e => this.updateConfig({ mypyVersion: e.target.value })}>
                  {
                    this.state.context.mypy_versions.map(([name, id]) => (
                      <option key={id} value={id}>{ name }</option>
                    ))
                  }
                </select>
                <select className="form-control mr-sm-2" id="python_version" title="Python Version (--python--version)" defaultValue="3.7" onChange={e => this.updateConfig({ pythonVersion: e.target.value })}>
                  {
                    this.state.context.python_versions.map(ver => (
                      <option key={ver} value={ver}>Python { ver }</option>
                    ))
                  }
                </select>
                <button type="button" className="btn btn-light my-2 my-sm-0" data-toggle="modal" data-target="#options-modal" onClick={this.optionsToggle}>Options</button>
              </Form>
              <form className="form-inline my-2 my-lg-0">
                <button type="button" className="btn btn-light my-2 my-sm-0" data-toggle="modal" data-target="#about-modal" onClick={this.aboutToggle}>About</button>
              </form>
            </Collapse>
          </Navbar>
        </header>
        <Editor
          annotations={this.state.annotations}
          initialCode={this.state.context.initial_code}
          onChange={this.onChange}
          code={this.state.source}
        />
        <div id="result">
          {result}
        </div>
        <Modal isOpen={this.state.optionsIsOpen} toggle={this.optionsToggle}>
          <ModalHeader toggle={this.optionsToggle}>
            Options
          </ModalHeader>
          <ModalBody>
            <form>
              <div className="form-row">
                <div className="col-md-6">
                  {
                    this.state.context.flags_normal.map(flag => (
                      <div className="checkbox" key={flag}>
                        <label htmlFor={flag}>
                          <input
                            type="checkbox"
                            className="mypy-options"
                            name={flag}
                            value="true"
                            onChange={e => this.updateConfig({ [flag]: e.target.checked })}
                          />
                          <code>--{ flag }</code>
                        </label>
                      </div>
                    ))
                  }
                </div>
                <div className="col-md-6">
                  {
                    this.state.context.flags_strict.map(flag => (
                      <div className="checkbox" key={flag}>
                        <label htmlFor="TODO">
                          <input
                            type="checkbox"
                            className="mypy-options"
                            name={flag}
                            value="true"
                            onChange={e => this.updateConfig({ [flag]: e.target.checked })}
                          />
                          <code>--{ flag }</code>
                        </label>
                      </div>
                    ))
                  }
                </div>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.optionsToggle}>Close</Button>
          </ModalFooter>
        </Modal>
        <Modal isOpen={this.state.aboutIsOpen} toggle={this.aboutToggle}>
          <ModalHeader toggle={this.aboutToggle}>About the mypy Playground</ModalHeader>
          <ModalBody>
            <p>
              The mypy Playground is a web service that receives a Python program with type hints,
              runs mypy inside a sandbox, then returns the output.
            </p>
            <p>
              This project is an open source project started by <a href="https://www.ymyzk.com">Yusuke Miyazaki (@ymyzk)</a>.
              Source code is available at <a href="https://github.com/ymyzk/mypy-playground">GitHub</a>.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.aboutToggle}>Close</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
