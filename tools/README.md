# Tools

Regression comparison of native CrossHair vs. the playground's Pyodide worker, using the
examples from CrossHair's [`support_treemap.svg`](https://github.com/pschanely/CrossHair/blob/main/doc/source/support_treemap.svg)
(about 600 `crosshair-web.org/?source=...` links, each with the verdict color the treemap shows).

```sh
cd tools && npm install && cd ..
curl -L https://raw.githubusercontent.com/pschanely/CrossHair/main/doc/source/support_treemap.svg -o /tmp/support_treemap.svg
python tools/extract_examples.py /tmp/support_treemap.svg > examples.json

# Native baseline (use a venv with `crosshair-tool`, ideally the same Python as Pyodide's):
python tools/run_native.py examples.json native.json --crosshair path/to/venv/bin/crosshair
# The real worker file, under Node (CrossHair defaults; add `-- --max_uninteresting_iterations=20` etc.):
node tools/run_pyodide.mjs examples.json pyodide.json

python tools/compare_runs.py examples.json native.json pyodide.json
```

Both runners checkpoint after every example and cap each example's wall-clock time
(`--timeout`, default 60s). Not meant for CI: a full run takes a while.
