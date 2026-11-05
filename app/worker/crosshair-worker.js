/* eslint-disable no-restricted-globals */
// Dedicated Web Worker that runs CrossHair inside Pyodide, off the UI thread.
//
// Must be started as a *module* worker (`new Worker(url, {type: 'module'})`):
// Pyodide 314 does not support classic workers.
// Served unbundled (see app.py: /worker/). It must not go through webpack.
//
// Protocol (main thread <-> worker):
//   worker -> main  {type: 'progress', text}
//                   {type: 'ready', crosshairVersion, pythonVersion}
//                   {type: 'init_failed', message}
//                   {type: 'stdout', id, text}              (streamed while running)
//                   {type: 'done', id, exit_code, stderr, duration}
//                   {type: 'error', id, message}
//   main -> worker  {type: 'run', id, source, args}
//
// A run cannot be interrupted from inside (wasm has no signals), so "Stop" is
// implemented by the main thread calling worker.terminate().

// Keep the version in the import and PYODIDE_URL in sync (imports can't be templated).
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
// Unpinned: always the newest CrossHair release that has a Pyodide wheel.
// Pin (e.g. 'crosshair-tool==0.0.113') if a release breaks the playground.
const CROSSHAIR_REQUIREMENT = 'crosshair-tool';
const SOURCE_PATH = '/tmp/main.py';

// CrossHair detects these at import time, so they must be installed up front,
// before crosshair is first imported. Small and pure-Python.
const CONTRACT_PACKAGES = ['deal', 'icontract'];
// Packages that only user code imports. Loaded on demand.
const OPTIONAL_PACKAGES = ['hypothesis', 'numpy'];

const PY_SETUP = `
import contextlib, importlib, io, json, linecache, sys, time
from crosshair.main import main

SOURCE_PATH = "${SOURCE_PATH}"

class _Emit:
    def __init__(self, emit):
        self.emit = emit
    def write(self, s):
        self.emit(s)
        return len(s)
    def flush(self):
        pass

import crosshair.auditwall as _auditwall

_open_wall = None

def open_wall():
    # After the first check, CrossHair's audit hook blocks the file writes that
    # installing/importing packages needs. Open it while we do that.
    global _open_wall
    if getattr(_auditwall, "_ENABLED", False):
        _open_wall = _auditwall.opened_auditwall()
        _open_wall.__enter__()

def close_wall():
    global _open_wall
    if _open_wall is not None:
        _open_wall.__exit__(None, None, None)
        _open_wall = None

def run_check(args, emit):
    # CrossHair imports the target as a module. Drop any copy from a previous
    # run, or edits to the source silently have no effect.
    for name in [n for n, m in list(sys.modules.items())
                 if getattr(m, "__file__", None) == SOURCE_PATH]:
        del sys.modules[name]
    linecache.clearcache()
    importlib.invalidate_caches()

    stderr = io.StringIO()
    code = 0
    start = time.time()
    with contextlib.redirect_stdout(_Emit(emit)), contextlib.redirect_stderr(stderr):
        try:
            main(list(args) + [SOURCE_PATH])
        except SystemExit as exit_:
            code = exit_.code if isinstance(exit_.code, int) else (0 if exit_.code is None else 1)
    return json.dumps({
        "exit_code": code,
        "stderr": stderr.getvalue(),
        "duration": int(1000 * (time.time() - start)),
    })
`;

let pyodide = null;
let micropip = null;
let runCheck = null;
let openWall = null;
let closeWall = null;

function progress(text) {
  self.postMessage({ type: 'progress', text });
}

async function init() {
  progress('Loading Python...');
  pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  progress('Loading CrossHair...');
  await pyodide.loadPackage('micropip');
  micropip = pyodide.pyimport('micropip');
  await micropip.install([CROSSHAIR_REQUIREMENT, ...CONTRACT_PACKAGES]);
  pyodide.runPython(PY_SETUP);
  runCheck = pyodide.globals.get('run_check');
  openWall = pyodide.globals.get('open_wall');
  closeWall = pyodide.globals.get('close_wall');
  const crosshairVersion = pyodide.runPython(
    'import importlib.metadata as m; m.version("crosshair-tool")',
  );
  self.postMessage({
    type: 'ready',
    crosshairVersion,
    pythonVersion: pyodide.runPython('import sys; ".".join(map(str, sys.version_info[:3]))'),
  });
}

const installed = new Set();

async function ensureOptionalPackages(source) {
  const wanted = OPTIONAL_PACKAGES.filter(
    name => !installed.has(name) && new RegExp(`^\\s*(?:import|from)\\s+${name}\\b`, 'm').test(source),
  );
  if (wanted.length === 0) return;
  openWall();
  try {
    for (const name of wanted) {
      progress(`Loading ${name}...`);
      try {
        // Pyodide's own distribution first (numpy, ...), then PyPI (deal, ...).
        await pyodide.loadPackage(name);
      } catch (e) {
        await micropip.install(name);
      }
      // Import now, while the wall is open: first imports can have side effects.
      pyodide.runPython(`import importlib; importlib.import_module(${JSON.stringify(name)})`);
      installed.add(name);
    }
  } finally {
    closeWall();
  }
}

async function run({ id, source, args }) {
  try {
    await ensureOptionalPackages(source);
    // Write from the JS side: CrossHair's audit hook (installed after the first
    // run) blocks file writes made from Python.
    pyodide.FS.writeFile(SOURCE_PATH, source);
    const emit = text => self.postMessage({ type: 'stdout', id, text });
    const result = JSON.parse(runCheck(args, emit));
    self.postMessage({ type: 'done', id, ...result });
  } catch (e) {
    self.postMessage({ type: 'error', id, message: String(e && e.message ? e.message : e) });
  }
}

const ready = init().catch((e) => {
  self.postMessage({ type: 'init_failed', message: String(e && e.message ? e.message : e) });
  throw e;
});

self.onmessage = async (event) => {
  if (event.data.type === 'run') {
    await ready;
    await run(event.data);
  }
};
