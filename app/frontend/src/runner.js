// Main-thread client for the CrossHair Web Worker (app/worker/crosshair-worker.js).
//
// The worker runs CrossHair in Pyodide, off the UI thread, for as long as the
// analysis takes. It cannot be interrupted from inside, so stop() terminates it
// and starts a fresh one (which has to load CrossHair again).

export const WORKER_URL = '/worker/crosshair-worker.js';

export default class CrossHairRunner {
  constructor(createWorker = () => new Worker(WORKER_URL, { type: 'module' })) {
    this.createWorker = createWorker;
    this.listeners = [];
    this.pending = null;
    this.nextId = 1;
    this.state = { status: 'loading', text: 'Starting...' };
    this.startWorker();
  }

  // Calls listener with the engine state {status: loading|ready|failed, ...}
  // now and on every change. Returns an unsubscribe function.
  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.state);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  setState(state) {
    this.state = state;
    this.listeners.forEach(listener => listener(state));
  }

  startWorker() {
    this.setState({ status: 'loading', text: 'Starting...' });
    const worker = this.createWorker();
    this.worker = worker;
    worker.onmessage = event => this.handleMessage(worker, event.data);
    worker.onerror = (event) => {
      if (worker === this.worker) {
        this.crashed(event && event.message ? event.message : 'The worker crashed');
      }
    };
  }

  handleMessage(worker, message) {
    if (worker !== this.worker) {
      return; // from a worker we already terminated
    }
    const run = this.pending;
    switch (message.type) {
      case 'progress':
        this.setState({ status: 'loading', text: message.text });
        break;
      case 'ready':
        this.setState({
          status: 'ready',
          crosshairVersion: message.crosshairVersion,
          pythonVersion: message.pythonVersion,
        });
        break;
      case 'init_failed':
        this.setState({ status: 'failed', message: message.message });
        break;
      case 'stdout':
        if (run && run.id === message.id) {
          run.stdout += message.text;
          run.onStdout(run.stdout);
        }
        break;
      case 'done':
        if (run && run.id === message.id) {
          this.pending = null;
          run.resolve({
            exit_code: message.exit_code,
            stdout: run.stdout,
            stderr: message.stderr,
            duration: message.duration,
            stopped: false,
          });
        }
        break;
      case 'error':
        if (run && run.id === message.id) {
          this.pending = null;
          run.reject(new Error(message.message));
        }
        break;
      default:
        break;
    }
  }

  // The worker died without telling us (e.g. out of memory).
  crashed(message) {
    const run = this.pending;
    this.pending = null;
    this.worker.terminate();
    this.startWorker();
    if (run) {
      run.reject(new Error(`CrossHair stopped unexpectedly: ${message}`));
    }
  }

  // Resolves with {exit_code, stdout, stderr, duration, stopped}. onStdout
  // receives all output so far, each time more arrives.
  run(source, args, onStdout = () => {}) {
    if (this.state.status !== 'ready') {
      return Promise.reject(new Error('CrossHair is not ready yet'));
    }
    if (this.pending) {
      return Promise.reject(new Error('A run is already in progress'));
    }
    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      this.pending = {
        id, stdout: '', onStdout, resolve, reject,
      };
      this.worker.postMessage({
        type: 'run', id, source, args,
      });
    });
  }

  // Abandons the current run. Output produced so far is kept.
  stop() {
    const run = this.pending;
    this.pending = null;
    this.worker.terminate();
    this.startWorker();
    if (run) {
      run.resolve({
        exit_code: null, stdout: run.stdout, stderr: '', duration: null, stopped: true,
      });
    }
  }

  dispose() {
    this.listeners = [];
    this.pending = null;
    this.worker.terminate();
  }
}
