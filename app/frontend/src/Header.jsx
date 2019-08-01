import React from 'react';
import {
  Button,
  Col,
  Collapse,
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
            <Form inline className="my-2 my-lg-0 mr-auto">
              <Button color="light" className="my-2 my-sm-0 mr-sm-2" id="run" disabled={status === 'running'} onClick={onRunClick}>Run</Button>
              <Button color="light" className="my-sm-0 mr-sm-2" disabled={status === 'creating_gist'} onClick={onGistClick}>Gist</Button>
              <Input
                type="select"
                className="mr-sm-2"
                title="mypy Version"
                defaultValue="latest"
                onChange={e => onConfigChange({ mypyVersion: e.target.value })}
              >
                {
                  context.mypy_versions.map(([name, id]) => (
                    <option key={id} value={id}>{ name }</option>
                  ))
                }
              </Input>
              <Input
                type="select"
                className="mr-sm-2"
                title="Python Version (--python--version)"
                defaultValue="3.7"
                onChange={e => onConfigChange({ pythonVersion: e.target.value })}
              >
                {
                  context.python_versions.map(ver => (
                    <option key={ver} value={ver}>Python { ver }</option>
                  ))
                }
              </Input>
              <Button color="light" className="my-2 my-sm-0" data-toggle="modal" data-target="#options-modal" onClick={this.optionsToggle}>
                Options
              </Button>
            </Form>
            <Form className="form-inline my-2 my-lg-0">
              <Button color="light" className="my-2 my-sm-0" data-toggle="modal" data-target="#about-modal" onClick={this.aboutToggle}>
                About
              </Button>
            </Form>
          </Collapse>
        </Navbar>
        <Modal isOpen={this.state.optionsIsOpen} toggle={this.optionsToggle}>
          <ModalHeader toggle={this.optionsToggle}>
            Options
          </ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup row>
                <Col md={6}>
                  {
                    context.flags_normal.map(flag => (
                      <FormGroup check key={flag}>
                        <Input
                          type="checkbox"
                          id={flag}
                          onChange={e => onConfigChange({ [flag]: e.target.checked })}
                        />
                        <Label check for={flag}>
                          <code>--{ flag }</code>
                        </Label>
                      </FormGroup>
                    ))
                  }
                </Col>
                <Col md={6}>
                  {
                    context.flags_strict.map(flag => (
                      <FormGroup check key={flag}>
                        <Input
                          type="checkbox"
                          id={flag}
                          onChange={e => onConfigChange({ [flag]: e.target.checked })}
                        />
                        <Label check for={flag}>
                          <code>--{ flag }</code>
                        </Label>
                      </FormGroup>
                    ))
                  }
                </Col>
              </FormGroup>
            </Form>
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
