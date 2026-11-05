import CrossHairRunner from '../src/runner';

class FakeWorker {
  constructor() {
    this.sent = [];
    this.terminated = false;
  }

  postMessage(message) { this.sent.push(message); }

  terminate() { this.terminated = true; }

  emit(data) { this.onmessage({ data }); }
}

function setup() {
  const workers = [];
  const runner = new CrossHairRunner(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  });
  return { runner, workers };
}

// Old Jest: no `.rejects.toThrow`. Resolves to the rejection's message.
const rejection = promise => promise.then(() => { throw new Error('did not reject'); }, e => e.message);

const ready = { type: 'ready', crosshairVersion: '1.0', pythonVersion: '3.14.0' };

describe('CrossHairRunner', () => {
  it('reports loading, then ready', () => {
    const { runner, workers } = setup();
    const states = [];
    runner.subscribe(s => states.push(s.status));
    workers[0].emit({ type: 'progress', text: 'Loading Python...' });
    workers[0].emit(ready);
    expect(states).toEqual(['loading', 'loading', 'ready']);
  });

  it('refuses to run before ready', async () => {
    const { runner } = setup();
    expect(await rejection(runner.run('x', ['check']))).toContain('not ready');
  });

  it('streams stdout and resolves with the result', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    const seen = [];
    const promise = runner.run('src', ['check', '--verbose'], text => seen.push(text));
    const { id } = workers[0].sent[0];
    expect(workers[0].sent[0]).toMatchObject({ type: 'run', source: 'src', args: ['check', '--verbose'] });
    workers[0].emit({ type: 'stdout', id, text: 'a\n' });
    workers[0].emit({ type: 'stdout', id, text: 'b\n' });
    workers[0].emit({
      type: 'done', id, exit_code: 1, stderr: '', duration: 5,
    });
    await expect(promise).resolves.toEqual({
      exit_code: 1, stdout: 'a\nb\n', stderr: '', duration: 5, crashed: null, stopped: false,
    });
    expect(seen).toEqual(['a\n', 'a\nb\n']);
  });

  it('passes a CrossHair crash traceback through', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    const promise = runner.run('src', ['check']);
    workers[0].emit({
      type: 'done', id: workers[0].sent[0].id, exit_code: 0, stderr: '', duration: 1, crashed: 'Traceback...\nValueError: x',
    });
    await expect(promise).resolves.toMatchObject({ crashed: 'Traceback...\nValueError: x' });
  });

  it('rejects overlapping runs', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    runner.run('a', ['check']);
    expect(await rejection(runner.run('b', ['check']))).toContain('already in progress');
  });

  it('stop() keeps partial output, terminates, and restarts the worker', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    const promise = runner.run('a', ['check']);
    workers[0].emit({ type: 'stdout', id: workers[0].sent[0].id, text: 'found\n' });
    runner.stop();
    await expect(promise).resolves.toMatchObject({ stopped: true, stdout: 'found\n' });
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
    expect(runner.state.status).toBe('loading');
    // Late messages from the old worker are ignored.
    workers[0].emit(ready);
    expect(runner.state.status).toBe('loading');
    workers[1].emit(ready);
    expect(runner.state.status).toBe('ready');
  });

  it('rejects the run and restarts when the worker crashes', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    const promise = runner.run('a', ['check']);
    workers[0].onerror({ message: 'out of memory' });
    expect(await rejection(promise)).toContain('out of memory');
    expect(workers).toHaveLength(2);
  });

  it('rejects when the worker reports an error', async () => {
    const { runner, workers } = setup();
    workers[0].emit(ready);
    const promise = runner.run('a', ['check']);
    workers[0].emit({ type: 'error', id: workers[0].sent[0].id, message: 'boom' });
    expect(await rejection(promise)).toContain('boom');
    // The worker is still usable.
    expect(runner.state.status).toBe('ready');
  });

  it('reports init failure', () => {
    const { runner, workers } = setup();
    workers[0].emit({ type: 'init_failed', message: 'network down' });
    expect(runner.state).toEqual({ status: 'failed', message: 'network down' });
  });
});
