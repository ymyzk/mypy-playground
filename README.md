# mypy-playground

![CI](https://github.com/ymyzk/mypy-playground/workflows/CI/badge.svg)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ymyzk/mypy-playground/blob/master/LICENSE)

**The mypy playground** provides Web UI to run mypy in the sandbox: https://mypy-play.net

[![https://gyazo.com/30cbc6dbd533834208e7ed099ce2f589](https://i.gyazo.com/30cbc6dbd533834208e7ed099ce2f589.gif)](https://gyazo.com/30cbc6dbd533834208e7ed099ce2f589)

## Features
- Web UI and sandbox for running mypy easily and safely
- Simple and nice editor with syntax highlighting and error reporting
- Share snippets with your friends using GitHub Gist

## Development
1. Run `docker-compose up -d` to start an app and Docker for running mypy
2. Run `docker-compose exec docker docker build --pull -t ymyzk/mypy-playground-sandbox:latest /sandbox/latest` to build a Docker image
3. Open http://localhost:8080

## Components
- [app](app): Application server
- [app/frontend](app/frontend): Frontend
- [sandbox](sandbox): Sandbox environments for running mypy

## Configuration
| Name | Type | Required | Description |
|:-----|:-----|:---------|:------------|
| `DEBUG` | bool | No | Enable debug mode (default: False) |
| `PORT` | int | No | Port number (default: 8080) |
| `SANDBOX` | str | No | Sandbox implementation to use (default: `mypy_playground.sandbox.docker.DockerSandbox`) |
| `SANDBOX_CONCURRENCY` | int | No | The number of running sandboxes at the same time (default: 3) |
| `GA_TRACKING_ID` | str | No | A tracking id for Google Analytics. If not specified, Google Analytics is disabled. |
| `GITHUB_TOKEN` | str | No | A token used to create gists |
| `ENABLE_PROMETHEUS` | bool | No | Enable Prometheus metrics endpoint (default: False) |
| `MYPY_VERSIONS` | list | No | List of mypy versions used by a sandbox (default: `mypy latest:latest`) |
| `DOCKER_IMAGES` | list | No | Docker images used by sandbox (default: `latest:ymyzk/mypy-playground-sandbox:latest`) |
| `CLOUD_FUNCTIONS_BASE_URL` | str | No | URL of Cloud Functions without function name |
| `CLOUD_FUNCTIONS_NAMES` | str | No | Map from mypy version ID to name of Cloud Functions |
| `CLOUD_FUNCTIONS_IDENTITY_TOKEN` | str | No | Identity token for development purpose |
