"""
Wrapper to run mypy on Cloud Functions.

This module should be able to run on Python 3.7 and later.
"""
from __future__ import annotations

import subprocess
import sys
import tempfile
from typing import NoReturn

from flask import Request, Response, abort, jsonify, make_response


def run_typecheck(request: Request) -> Response:
    if request.method != "POST":
        abort_api(405, "Only POST method is supported.")
    data = request.get_json()
    if data is None:
        abort_api(400, "Failed to parse JSON payload.")
    if not isinstance(data, dict):
        abort_api(400, "JSON object must be provided.")
    source = data.get("source")
    if not isinstance(source, str):
        abort_api(400, "'source' field must contain a string.")
    options = data.get("options", [])
    if not isinstance(options, list):
        abort_api(400, "'options' field must be a list.")
    for option in options:
        if not isinstance(option, str):
            abort_api(400, "'options' field must be a list of strings.")

    return jsonify(run_mypy(source, options))


def run_mypy(source: str, options: list[str]) -> dict[str, int | str]:
    with tempfile.NamedTemporaryFile(mode="w") as f:
        f.write(source)
        f.flush()
        process = subprocess.run(
            [sys.executable, "-m", "mypy"] + options + [f.name], capture_output=True
        )
        return {
            "exit_code": process.returncode,
            "stderr": process.stderr.decode().replace(f.name, "main.py"),
            "stdout": process.stdout.decode().replace(f.name, "main.py"),
        }


def abort_api(status: int, message: str) -> NoReturn:
    abort(make_response(jsonify(message=message), status))
