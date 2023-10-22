import React from "react";
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
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler,
} from "reactstrap";

import styles from "./Header.module.css";
import MultiSelectOption from "./MultiSelectOption";
import { Config, Context } from "./types";

type Props = {
  context: Context;
  config: Config;
  status: any;
  onGistClick: any;
  onRunClick: any;
  onConfigChange: any;
};

type State = {
  aboutIsOpen: boolean;
  navbarIsOpen: boolean;
  optionsIsOpen: boolean;
};

class Header extends React.Component<Props, State> {
  state = {
    aboutIsOpen: false,
    navbarIsOpen: false,
    optionsIsOpen: false,
  };

  toggle(name: string) {
    const stateName = `${name}IsOpen`;
    // @ts-ignore
    this.setState((prevState) => ({
      // @ts-ignore
      [stateName]: !prevState[stateName],
    }));
  }

  render() {
    const { context, config, status, onGistClick, onRunClick, onConfigChange } = this.props;
    const { aboutIsOpen, navbarIsOpen, optionsIsOpen } = this.state;

    const half = Math.ceil(context.flags.length / 2);
    const flagsColumns = [context.flags.slice(0, half), context.flags.slice(half, context.flags.length)];

    return (
      <header className={styles.header}>
        <Navbar color="primary" dark expand="lg">
          {/* .mb-0 is for overriding margin by .h1 */}
          <NavbarBrand href="/" className="h1 mb-0">
            mypy Playground
          </NavbarBrand>
          <NavbarToggler onClick={() => this.toggle("navbar")} />
          <Collapse navbar isOpen={navbarIsOpen}>
            <Nav navbar className="me-auto my-2 my-lg-0">
              <Form className="d-flex flex-wrap flex-md-nowrap">
                <Button
                  color="light"
                  className={`me-2 mb-2 mb-lg-0 ${styles.run}`}
                  disabled={status === "running"}
                  onClick={onRunClick}
                >
                  Run
                </Button>
                <Button
                  color="light"
                  className="me-2 mb-2 mb-lg-0"
                  disabled={status === "creating_gist"}
                  onClick={onGistClick}
                >
                  Gist
                </Button>
                {/* Using w-auto for <Input type="select"> to override "width: 100%" set by
                    the form-select class. */}
                <Input
                  type="select"
                  className="me-2 mb-2 mb-lg-0 w-auto"
                  title="mypy Version"
                  value={config.mypyVersion}
                  onChange={(e) => onConfigChange({ mypyVersion: e.target.value })}
                >
                  {context.mypyVersions.map(([name, id]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </Input>
                <Input
                  type="select"
                  className="me-2 mb-2 mb-lg-0 w-auto"
                  title="Python Version (--python--version)"
                  value={config.pythonVersion}
                  onChange={(e) => onConfigChange({ pythonVersion: e.target.value })}
                >
                  {context.pythonVersions.map((ver) => (
                    <option key={ver} value={ver}>
                      Python {ver}
                    </option>
                  ))}
                </Input>
                <Button
                  color="light"
                  className="me-2 mb-2 mb-lg-0"
                  data-toggle="modal"
                  data-target="#options-modal"
                  onClick={() => this.toggle("options")}
                >
                  Options
                </Button>
              </Form>
            </Nav>
            <Button
              color="light"
              className="my-2 my-lg-0"
              data-toggle="modal"
              data-target="#about-modal"
              onClick={() => this.toggle("about")}
            >
              About
            </Button>
          </Collapse>
        </Navbar>
        <Modal isOpen={optionsIsOpen} toggle={() => this.toggle("options")} className={styles.optionsModal}>
          <ModalHeader toggle={() => this.toggle("options")}>Options</ModalHeader>
          <ModalBody>
            <p>
              Please see <a href="https://mypy.readthedocs.io/en/stable/command_line.html">mypy&apos;s documentation</a>{" "}
              to learn effect of each option.
            </p>
            <Form>
              <FormGroup row>
                {flagsColumns.map((flags) => (
                  <Col md={6} key={flags[0]}>
                    {flags.map((flag) => (
                      <FormGroup check key={flag}>
                        <Input
                          type="checkbox"
                          id={flag}
                          checked={config[flag] as boolean}
                          onChange={(e) => onConfigChange({ [flag]: e.target.checked })}
                        />
                        <Label check for={flag} className="mb-0">
                          <code>
                            --
                            {flag}
                          </code>
                        </Label>
                      </FormGroup>
                    ))}
                  </Col>
                ))}
              </FormGroup>
              <FormGroup>
                {Object.entries(context.multiSelectOptions).map(([k, v]) => (
                  <MultiSelectOption
                    key={k}
                    name={k}
                    choices={v}
                    values={config[k] as string[]}
                    onConfigChange={onConfigChange}
                  />
                ))}
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggle("options")}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
        <Modal isOpen={aboutIsOpen} toggle={() => this.toggle("about")}>
          <ModalHeader toggle={() => this.toggle("about")}>About the mypy Playground</ModalHeader>
          <ModalBody>
            <p>
              The mypy Playground is a web service that receives a Python program with type hints, runs{" "}
              <a href="http://www.mypy-lang.org/">mypy</a> inside a sandbox, then returns the output.
            </p>
            <p>
              This project is an open source project started by{" "}
              <a href="https://www.ymyzk.com">Yusuke Miyazaki (@ymyzk)</a>. Source code is available at{" "}
              <a href="https://github.com/ymyzk/mypy-playground">GitHub</a> and you can run your own mypy Playground
              instance if you want.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggle("about")}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </header>
    );
  }
}

export default Header;
