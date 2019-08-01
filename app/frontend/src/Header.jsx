import React from 'react';
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

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.aboutToggle = this.aboutToggle.bind(this);
    this.optionsToggle = this.optionsToggle.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  state = {
    aboutIsOpen: false,
    optionsIsOpen: false,
    isOpen: false,
  };

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

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen,
    });
  }

  render() {
    const {
      context,
      status,
      onGistClick,
      onRunClick,
      onConfigChange,
    } = this.props;

    return (
      <header>
        <Navbar dark expand="lg">
          <NavbarBrand href="/" className="h1 mb-0">mypy Playground</NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse navbar isOpen={this.state.isOpen}>
            <Form className="form-inline my-2 my-lg-0 mr-auto">
              <button type="button" className="btn btn-light my-2 my-sm-0 mr-sm-2" id="run" disabled={status === 'running'} onClick={onRunClick}>Run</button>
              <button type="button" className="btn btn-light my-2 my-sm-0 mr-sm-2" id="gist" disabled={status === 'creating_gist'} onClick={onGistClick}>Gist</button>
              <select className="form-control mr-sm-2" id="mypy_version" title="mypy Version" defaultValue="latest" onChange={e => onConfigChange({ mypyVersion: e.target.value })}>
                {
                  context.mypy_versions.map(([name, id]) => (
                    <option key={id} value={id}>{ name }</option>
                  ))
                }
              </select>
              <select className="form-control mr-sm-2" id="python_version" title="Python Version (--python--version)" defaultValue="3.7" onChange={e => onConfigChange({ pythonVersion: e.target.value })}>
                {
                  context.python_versions.map(ver => (
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
        <Modal isOpen={this.state.optionsIsOpen} toggle={this.optionsToggle}>
          <ModalHeader toggle={this.optionsToggle}>
            Options
          </ModalHeader>
          <ModalBody>
            <form>
              <div className="form-row">
                <div className="col-md-6">
                  {
                    context.flags_normal.map(flag => (
                      <div className="checkbox" key={flag}>
                        <label htmlFor={flag}>
                          <input
                            type="checkbox"
                            className="mypy-options"
                            id={flag}
                            value="true"
                            onChange={e => onConfigChange({ [flag]: e.target.checked })}
                          />
                          <code>--{ flag }</code>
                        </label>
                      </div>
                    ))
                  }
                </div>
                <div className="col-md-6">
                  {
                    context.flags_strict.map(flag => (
                      <div className="checkbox" key={flag}>
                        <label htmlFor={flag}>
                          <input
                            type="checkbox"
                            className="mypy-options"
                            id={flag}
                            value="true"
                            onChange={e => onConfigChange({ [flag]: e.target.checked })}
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
      </header>
    );
  }
}

export default Header;
