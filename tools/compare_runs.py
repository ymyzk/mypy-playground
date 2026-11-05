"""Compare native and Pyodide runs of the same examples.

Usage: python tools/compare_runs.py examples.json native.json pyodide.json

Outcome = counterexample found (exit 1 with output) / none (0) / error (2) /
crash (an uncaught exception: native Python also exits 1, but prints nothing on
stdout; Pyodide reports it as an error) / timeout.
Output text is compared after normalizing the /tmp/main.py path.

Compare against a native Python of the same minor version as Pyodide's: some
differences (and hangs) are Python-version differences, not wasm differences.
"""
import collections
import json
import re
import sys


def outcome(r):
    if r.get("timeout"):
        return "timeout"
    if r.get("error"):
        return "crash"
    if r["code"] == 1:
        return "CE" if r["out"].strip() else "crash"
    return {0: "ok", 2: "error"}.get(r["code"], f"exit{r['code']}")


def norm(s):
    return re.sub(r"^\S*?/tmp/main.py", "/tmp/main.py", s, flags=re.M)


def main() -> None:
    examples = {str(e["id"]): e for e in json.load(open(sys.argv[1]))}
    native = json.load(open(sys.argv[2]))
    pyodide = json.load(open(sys.argv[3]))
    ids = [i for i in examples if i in native and i in pyodide]
    table = collections.Counter()
    diffs = []
    for i in ids:
        n, p = native[i], pyodide[i]
        table[(examples[i]["verdict"], outcome(n), outcome(p))] += 1
        if outcome(n) != outcome(p):
            diffs.append(("OUTCOME", i, n, p))
        elif norm(n["out"]) != norm(p["out"]):
            diffs.append(("TEXT", i, n, p))
    print(f"compared {len(ids)} of {len(examples)} examples")
    print("(treemap verdict, native, pyodide): count")
    for k, v in sorted(table.items(), key=str):
        print("  ", k, v)
    secs_n = sum(native[i]["secs"] for i in ids)
    secs_p = sum(pyodide[i]["secs"] for i in ids)
    print(f"total seconds: native {secs_n:.0f}, pyodide {secs_p:.0f}")
    slow = sorted(ids, key=lambda i: pyodide[i]["secs"] - native[i]["secs"], reverse=True)[:10]
    print("largest pyodide slowdowns (id, native s, pyodide s):")
    for i in slow:
        print("  ", i, native[i]["secs"], pyodide[i]["secs"], examples[i]["source"].strip().splitlines()[-1].strip()[:60])
    print(f"\n{len(diffs)} differences")
    for kind, i, n, p in diffs:
        last = examples[i]["source"].strip().splitlines()[-1].strip()[:60]
        print(f"- [{kind}] id={i} ({examples[i]['verdict']}) {last}")
        print(f"    native {outcome(n)} {n['secs']}s: {norm(n['out'])[-120:]!r}")
        print(f"    pyodide {outcome(p)} {p['secs']}s: {norm(p['out'])[-120:]!r} {p['err'][-80:]!r}")


if __name__ == "__main__":
    main()
