# mypy-plyground

[![Build Status](https://travis-ci.org/ymyzk/mypy-playground.svg?branch=master)](https://travis-ci.org/ymyzk/mypy-playground)

**The mypy playgrund** provides Web UI to run mypy in the sandbox: https://mypy-play.net

[![https://gyazo.com/30cbc6dbd533834208e7ed099ce2f589](https://i.gyazo.com/30cbc6dbd533834208e7ed099ce2f589.gif)](https://gyazo.com/30cbc6dbd533834208e7ed099ce2f589)

## Features
- Web UI and sandbox for running mypy easily and safely
- Simple and nice editor with syntax highlighting and error reporting
- Share snippets with your friends using GitHub Gist

## Development
1. Run `docker-compose up -d` to start an app and Docker for running mypy
2. Run `docker-compose exec docker ash -c "cd /sandbox; docker build --pull -t ymyzk/mypy-playground:sandbox ."` to build a Docker image
3. Open http://localhost:8080

## Components
- [app](app): Application server
- [sandbox](sandbox): A Docker image for running mypy

## Configuration
| Name | Required | Description |
|:-----|:---------|:------------|
| `DEBUG` | No | Enable debug mode (default: 0) |
| `PORT` | No | Port number (default: 8080) |
| `DOCKER_IMAGE` | No | A Docker image used by Sandbox (default: `ymyzk/mypy-playground:sandbox`) |
| `SANDBOX_CONCURRENCY` | No | The number of running sandboxes at the same time (default: 3) |
| `GA_TRACKING_ID` | No | A tracking id for Google Analytics |
| `GITHUB_TOKEN` | No | A token used to create gists |
