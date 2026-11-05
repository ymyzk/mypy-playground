// Worker thread for run_pyodide.mjs: hosts app/frontend/public/crosshair-worker.js with a
// minimal Web Worker global scope shim.
import fs from "node:fs";
import { parentPort } from "node:worker_threads";
import { loadPyodide } from "pyodide";

const workerPath = new URL("../app/frontend/public/crosshair-worker.js", import.meta.url);
let pending = null;

globalThis.self = globalThis;
globalThis.__lp = () => loadPyodide({ stdout: () => {}, stderr: () => {} });
globalThis.postMessage = (m) => {
  if (m.type === "ready") parentPort.postMessage({ type: "ready" });
  else if (m.type === "init_failed") parentPort.postMessage({ type: "ready_failed", message: m.message });
  else if (m.type === "stdout") pending.stdout += m.text;
  else if (m.type === "done") parentPort.postMessage({ ...m, stdout: pending.stdout });
  else if (m.type === "error") parentPort.postMessage(m);
};
// The worker imports Pyodide from a CDN URL; here we use the npm package.
const code = fs
  .readFileSync(workerPath, "utf8")
  .replace(/^import \{ loadPyodide \} from .*$/m, "const loadPyodide = globalThis.__lp;");
(0, eval)(code);

parentPort.on("message", async ({ source, args }) => {
  pending = { stdout: "" };
  await globalThis.onmessage({ data: { type: "run", id: 1, source, args } });
});
