// Run examples through the real playground worker (app/frontend/public/crosshair-worker.js)
// under Node, with a wall-clock cap per example.
//
// Usage: node tools/run_pyodide.mjs examples.json out.json [--timeout SECS] [-- crosshair args...]
//
// Each example runs in a worker thread that is terminated and restarted on
// timeout (a run can't be interrupted from inside, just like in the browser).
// Needs `npm install` in tools/ (for the pyodide package).
import fs from "node:fs";
import { Worker } from "node:worker_threads";

const argv = process.argv.slice(2);
const dashdash = argv.indexOf("--");
const crosshairArgs = dashdash >= 0 ? argv.slice(dashdash + 1) : [];
const own = dashdash >= 0 ? argv.slice(0, dashdash) : argv;
const [examplesPath, outPath] = own;
const tIdx = own.indexOf("--timeout");
const timeoutMs = (tIdx >= 0 ? Number(own[tIdx + 1]) : 60) * 1000;
const examples = JSON.parse(fs.readFileSync(examplesPath, "utf8"));
const threadFile = new URL("./run_pyodide_thread.mjs", import.meta.url);

let worker = null;
let ready = null;

function start() {
  worker = new Worker(threadFile);
  ready = new Promise((resolve, reject) => {
    worker.once("message", (m) => (m.type === "ready" ? resolve() : reject(new Error(m.message))));
    worker.once("error", reject);
  });
}

function runOne(source) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      start();
      resolve({ code: null, out: "", err: "", timeout: true });
    }, timeoutMs);
    const onMessage = (m) => {
      if (m.type === "done") {
        clearTimeout(timer);
        worker.off("message", onMessage);
        resolve({ code: m.exit_code, out: m.stdout, err: m.stderr.slice(-500), timeout: false });
      } else if (m.type === "error") {
        clearTimeout(timer);
        worker.off("message", onMessage);
        resolve({ code: null, out: "", err: m.message.slice(-500), timeout: false, error: true });
      }
    };
    worker.on("message", onMessage);
    worker.postMessage({ source, args: ["check", ...crosshairArgs] });
  });
}

start();
const results = {};
for (const [i, ex] of examples.entries()) {
  await ready; // after a timeout kill, wait for the fresh worker to load CrossHair
  const t = Date.now();
  const res = await runOne(ex.source);
  res.secs = Math.round((Date.now() - t) / 10) / 100;
  results[ex.id] = res;
  console.log(`[${i + 1}/${examples.length}] ${ex.id} code=${res.code} ${res.secs}s${res.timeout ? " TIMEOUT" : ""}`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 1)); // checkpoint
}
await worker.terminate();
