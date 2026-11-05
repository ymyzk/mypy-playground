# CrossHair Playground

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/pschanely/crosshair-playground/blob/master/LICENSE)

**The CrossHair playground** provides a Web UI to run [CrossHair](https://github.com/pschanely/CrossHair) in your browser, using [Pyodide](https://pyodide.org/). Try it out here: https://crosshair-web.org

## Features
- Runs CrossHair entirely client-side, in a Web Worker: no server-side code execution, and no time limit (there is a Stop button)
- Simple and nice editor with syntax highlighting and error reporting
- Share snippets with your friends using GitHub Gist

## Development
1. Run `docker-compose up -d --build` to start the app
2. Open http://localhost:8080

To work on the frontend only: `cd app/frontend && npm ci && npm test` (use Node 14; the Neutrino 8 toolchain doesn't build on newer Node versions).

## How it works
The browser loads Pyodide from jsDelivr (version pinned in `app/worker/crosshair-worker.js`) and installs the latest `crosshair-tool` release from PyPI that has a Pyodide wheel. The worker is served as a plain static file at `/worker/crosshair-worker.js`.

To pin CrossHair (e.g. if a release breaks the playground), set `CROSSHAIR_REQUIREMENT` in the worker, e.g. `crosshair-tool==0.0.113`.

## Packaging
Package the frontend & backend:
```sh
docker build -f ~/proj/crosshair-playground/app/Dockerfile-prod -t pschanely/crosshair-playground:latest ~/proj/crosshair-playground/app/ && docker push pschanely/crosshair-playground
```
Deploy a package:
```sh
cd crosshair-playground/ && docker-compose pull && docker-compose down && docker-compose up -d
```

## Components
- [app](app): Application server
- [app/frontend](app/frontend): Frontend
- [app/worker](app/worker): Web Worker that runs CrossHair in Pyodide
- [tools](tools): Helper scripts

## Configuration
| Name | Type | Required | Description |
|:-----|:-----|:---------|:------------|
| `DEBUG` | bool | No | Enable debug mode (default: False) |
| `PORT` | int | No | Port number (default: 8080) |
| `GA_TRACKING_ID` | str | No | A tracking id for Google Analytics. If not specified, Google Analytics is disabled. |
| `GITHUB_TOKEN` | str | No | A token used to create gists |
