"""Run examples through native `crosshair check`, one subprocess each.

Usage:
  python tools/run_native.py examples.json out.json [--crosshair PATH]
         [--timeout SECS] [-- crosshair args...]

With no extra args, CrossHair's defaults are used (like the playground).
out.json maps example id -> {code, out, err, secs, timeout}.
"""
import argparse
import json
import os
import subprocess
import tempfile
import time


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("examples")
    parser.add_argument("out")
    parser.add_argument("--crosshair", default="crosshair")
    parser.add_argument("--timeout", type=float, default=60.0, help="wall-clock cap per example")
    parser.add_argument("crosshair_args", nargs="*")
    args = parser.parse_args()

    examples = json.load(open(args.examples))
    results = {}
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "main.py")
        for i, ex in enumerate(examples):
            with open(path, "w") as f:
                f.write(ex["source"])
            start = time.time()
            try:
                proc = subprocess.run(
                    [args.crosshair, "check", *args.crosshair_args, path],
                    capture_output=True,
                    text=True,
                    timeout=args.timeout,
                )
                res = {"code": proc.returncode, "out": proc.stdout, "err": proc.stderr[-500:], "timeout": False}
            except subprocess.TimeoutExpired:
                res = {"code": None, "out": "", "err": "", "timeout": True}
            res["out"] = res["out"].replace(path, "/tmp/main.py")
            res["secs"] = round(time.time() - start, 2)
            results[str(ex["id"])] = res
            print(f"[{i + 1}/{len(examples)}] {ex['id']} code={res['code']} {res['secs']}s", flush=True)
            json.dump(results, open(args.out, "w"), indent=1)  # checkpoint


if __name__ == "__main__":
    main()
