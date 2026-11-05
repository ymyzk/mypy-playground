# CrossHair Playground

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/pschanely/crosshair-playground/blob/master/LICENSE)

**The CrossHair playground** provides a Web UI to run [CrossHair](https://github.com/pschanely/CrossHair) in your browser, using [Pyodide](https://pyodide.org/). Try it out here: https://crosshair-web.org

## Features
- Runs CrossHair entirely client-side, in a Web Worker: no server-side code execution, and no time limit (there is a Stop button)
- Simple and nice editor with syntax highlighting and error reporting
- Share snippets as a self-contained link (the code is deflated into the URL hash); `?gist=<id>` loads an existing gist (used by the Examples menu)

## Development
The site is fully static (Vite + React). From `app/frontend`:
```sh
npm ci
npm run dev      # http://localhost:5173
npm test
npm run build    # output in app/frontend/dist
```
Set `VITE_GA_TRACKING_ID` at build time to enable Google Analytics.

## How it works
The browser loads Pyodide from jsDelivr (version pinned in `app/frontend/public/crosshair-worker.js`) and installs the latest `crosshair-tool` release from PyPI that has a Pyodide wheel. The worker is a plain static file next to `index.html`.

To pin CrossHair (e.g. if a release breaks the playground), set `CROSSHAIR_REQUIREMENT` in the worker, e.g. `crosshair-tool==0.0.113`.

## Deployment
`.github/workflows/deploy.yml` builds and publishes `app/frontend/dist` to GitHub Pages on every push to `master`. Any static host works; asset paths are relative.

## Components
- [app/frontend](app/frontend): The whole app (Vite + React)
- [app/frontend/public/crosshair-worker.js](app/frontend/public/crosshair-worker.js): Web Worker that runs CrossHair in Pyodide
- [tools](tools): Helper scripts
