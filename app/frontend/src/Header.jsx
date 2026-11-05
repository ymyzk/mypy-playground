import React from 'react';
import {
  Button,
  ButtonDropdown,
  Col,
  Collapse,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  FormGroup,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarToggler,
} from 'reactstrap';

import {
  ADVANCED_NUMBER_OPTIONS,
  ANALYSIS_KINDS,
  BOOLEAN_FLAGS,
  NUMBER_OPTIONS,
} from './config';

const OPTION_HELP = {
  verbose: 'Output additional debugging information',
  report_all: 'Report the results of all postconditions, not just failing ones',
  max_uninteresting_iterations: 'Stop after this many consecutive iterations without significant progress. Larger values mean a deeper (and slower) search. CrossHair\'s default is 5.',
  per_condition_timeout: 'Maximum CPU seconds to spend on one condition.',
  per_path_timeout: 'Maximum CPU seconds to spend on one execution path.',
};

class Header extends React.Component {
  state = {
    aboutIsOpen: false,
    navbarIsOpen: false,
    optionsIsOpen: false,
    advancedIsOpen: false,
  };

  toggle(name) {
    const stateName = `${name}IsOpen`;
    this.setState({
      [stateName]: !this.state[stateName],
    });
  }

  render() {
    const {
      context,
      config,
      status,
      engineStatus,
      onGistClick,
      onRunClick,
      onStopClick,
      onConfigChange,
    } = this.props;

    const toggleKind = (kind, checked) => {
      const kinds = config.analysis_kind.filter(k => k !== kind);
      onConfigChange({ analysis_kind: checked ? [...kinds, kind] : kinds });
    };
    const numberField = name => (
      <FormGroup key={name}>
        <Label for={name}><code>--{ name }</code></Label>
        <Input
          type="number"
          min="0"
          bsSize="sm"
          id={name}
          placeholder="default"
          value={config[name]}
          onChange={e => onConfigChange({ [name]: e.target.value })}
        />
        <small className="text-muted">{ OPTION_HELP[name] }</small>
      </FormGroup>
    );

    return (
      <header>
        <Navbar dark expand="lg">
          <NavbarBrand href="/" className="h1 mb-0">
            <span> CrossHair Playground</span>
            <svg height={71} width={33} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
              <image
                xlinkHref="https://raw.githubusercontent.com/pschanely/CrossHair/master/doc/source/logo.png"
                height={71}
                width={33}
              />
            </svg>
          </NavbarBrand>
          <NavbarToggler onClick={() => this.toggle('navbar')} />
          <Collapse navbar isOpen={this.state.navbarIsOpen}>
            <Form inline className="my-2 my-lg-0 mr-auto">
              {
                status === 'running'
                  ? <Button color="danger" size="sm" className="my-2 my-sm-0 mr-sm-2" id="stop" onClick={onStopClick}>Stop</Button>
                  : <Button color="light" size="sm" className="my-2 my-sm-0 mr-sm-2" id="run" disabled={engineStatus !== 'ready'} onClick={onRunClick}>Run</Button>
              }
	      <ButtonDropdown className="my-2 my-sm-0 mr-sm-2" isOpen={this.state.examplesIsOpen} toggle={() => this.toggle('examples')}>
	        <DropdownToggle caret color="light" size="sm">
                  Examples
	        </DropdownToggle>
	        <DropdownMenu>
                  <DropdownItem tag="a" href="?gist=c8647d42431f17b217d717825d5f156b">Simple arithmetic</DropdownItem>
                  <DropdownItem tag="a" href="?gist=344bc539abb164fe7acd3eb456f13295">Exception discovery</DropdownItem>
                  <DropdownItem tag="a" href="?gist=5edfa8ccb5050d184a43c7a068fd8091">Hash consistent with equals</DropdownItem>
                  <DropdownItem tag="a" href="?gist=25af643aa651249bd3c6d3fdbfb09e78">Rolling averages</DropdownItem>
                  <DropdownItem tag="a" href="?gist=5c8cfb1f2806d3840a269b17357c900d">Regular expressions</DropdownItem>
                </DropdownMenu>
	      </ButtonDropdown>
              <Button color="light" size="sm" className="my-sm-0 mr-sm-2" disabled={status === 'creating_gist'} onClick={onGistClick}>Gist</Button>
              <Button color="light" size="sm" className="my-2 my-sm-0" data-toggle="modal" data-target="#options-modal" onClick={() => this.toggle('options')}>
                Options
              </Button>
            </Form>
            <Form className="form-inline my-2 my-lg-0">
              <Button color="light" size="sm" className="my-2 my-sm-0" data-toggle="modal" data-target="#about-modal" onClick={() => this.toggle('about')}>
                About
              </Button>
            </Form>
          </Collapse>
        </Navbar>
        <Modal size="lg" isOpen={this.state.optionsIsOpen} toggle={() => this.toggle('options')}>
          <ModalHeader toggle={() => this.toggle('options')}>
            Options
          </ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup row>
                <Col md={6}>
                  {
                    BOOLEAN_FLAGS.map(flag => (
                      <FormGroup check key={flag}>
                        <Input
                          type="checkbox"
                          id={flag}
                          checked={config[flag]}
                          onChange={e => onConfigChange({ [flag]: e.target.checked })}
                        />
                        <Label check for={flag}>
                          <code>--{ flag }</code>
                        </Label>
                        <br />
                        <small className="text-muted">{ OPTION_HELP[flag] }</small>
                      </FormGroup>
                    ))
                  }
                </Col>
                <Col md={6}>
                  <div><code>--analysis_kind</code> (default: PEP316, icontract, deal)</div>
                  {
                    ANALYSIS_KINDS.map(kind => (
                      <FormGroup check key={kind}>
                        <Input
                          type="checkbox"
                          id={`kind-${kind}`}
                          checked={config.analysis_kind.includes(kind)}
                          onChange={e => toggleKind(kind, e.target.checked)}
                        />
                        <Label check for={`kind-${kind}`}>{ kind }</Label>
                      </FormGroup>
                    ))
                  }
                </Col>
              </FormGroup>
              { NUMBER_OPTIONS.map(numberField) }
              <Button color="link" size="sm" className="p-0" id="advanced-toggle" onClick={(e) => { e.preventDefault(); this.toggle('advanced'); }}>
                { this.state.advancedIsOpen ? '▾' : '▸' } Advanced settings
              </Button>
              <Collapse isOpen={this.state.advancedIsOpen}>
                <div className="mt-2">
                  { ADVANCED_NUMBER_OPTIONS.map(numberField) }
                </div>
              </Collapse>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggle('options')}>Close</Button>
          </ModalFooter>
        </Modal>
        <Modal isOpen={this.state.aboutIsOpen} toggle={() => this.toggle('about')}>
          <ModalHeader toggle={() => this.toggle('about')}>About the CrosHair Playground</ModalHeader>
          <ModalBody>
            <p>
              The CrossHair Playground runs <a href="https://github.com/pschanely/CrossHair">CrossHair</a> on
              your Python code, entirely in your browser (using <a href="https://pyodide.org/">Pyodide</a>).
              Your code is never sent to a server, unless you share it as a gist.
            </p>
            <p>
              <span>This project is </span>
              <a href="https://github.com/pschanely/crosshair-playground">forked</a>
              <span> from, and nearly identical to </span>
              <a href="https://mypy-play.net/">mypy Playground</a>
              <span> by </span>
              <a href="https://www.ymyzk.com">Yusuke Miyazaki (@ymyzk)</a>.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggle('about')}>Close</Button>
          </ModalFooter>
        </Modal>
      </header>
    );
  }
}

export default Header;
