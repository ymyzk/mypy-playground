# mypy-plyground

[![CircleCI Status](https://circleci.com/gh/ymyzk/mypy-playground.svg?style=shield)](https://circleci.com/gh/ymyzk/mypy-playground)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ymyzk/mypy-playground/blob/master/LICENSE)

**The mypy playgrund** provides Web UI to run mypy in the sandbox: https://mypy-play.net

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
- [sandbox](sandbox): Docker images for running mypy

## Configuration
| Name | Type | Required | Description |
|:-----|:-----|:---------|:------------|
| `DEBUG` | bool | No | Enable debug mode (default: False) |
| `PORT` | int | No | Port number (default: 8080) |
| `DOCKER_IMAGES` | list | No | Docker images used by sandbox (default: `mypy latest:latest`) |
| `SANDBOX_CONCURRENCY` | int | No | The number of running sandboxes at the same time (default: 3) |
| `GA_TRACKING_ID` | str | No | A tracking id for Google Analytics. If not specified, Google Analytics is disabled. |
| `GITHUB_TOKEN` | str | No | A token used to create gists |
| `MYPY_VERSIONS` | list | No | List of mypy versions used by a sandbox (default: `latest:ymyzk/mypy-playground-sandbox:latest`) |
