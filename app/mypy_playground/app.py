from os import environ, path
from typing import Any, Dict

import bottle
from bottle import abort, request, response, static_file, template

from . import gist, sandbox
from .utils import setup_logger


app = bottle.default_app()
logger = setup_logger(__name__)
root_dir = path.dirname(path.dirname(__file__))
static_dir = path.join(root_dir, "static")
python_versions = [str(v) for v in (2.7, 3.3, 3.4, 3.5, 3.6)]
initial_code = """from typing import Iterator


def fib(n: int) -> Iterator[int]:
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b


fib(10)
fib("10")
"""

_json_response = Dict[str, Any]


@app.route("/")
def index():
    context = {
        "initial_code": initial_code,
        "python_versions": python_versions,
        "flags_normal": sandbox.ARGUMENT_FLAGS_NORMAL,
        "flags_strict": sandbox.ARGUMENT_FLAGS_STRICT,
        "ga_tracking_id": app.config.get("mypy_play.ga.tracking_id"),
    }
    return template("index", **context)


@app.route("/typecheck.json", method="POST")
def typecheck() -> _json_response:
    source = request.json.get("source")
    if source is None or not isinstance(source, str):
        abort(400)

    options = {}
    python_version = request.json.get("python_version")
    if python_version is not None and python_version in python_versions:
        options["python_version"] = python_version
    for flag in sandbox.ARGUMENT_FLAGS:
        flag_value = request.json.get(flag)
        if flag_value is not None and flag_value is True:
            options[flag] = flag_value

    result = sandbox.run_typecheck(source, **options)
    if result is None:
        logger.warn("an error occurred during running type-check")
        abort(500)

    return result.to_dict()  # type: ignore


@app.route("/gist", method="POST")
def create_gist():
    source = request.json.get("source")
    if source is None or not isinstance(source, str):
        abort(400)

    result = gist.create_gist(source)

    if result is None:
        abort(500)

    response.status = 201

    return result


@app.route("/static/<filename>")
def server_static(filename):
    return static_file(filename, root=static_dir)


app.config.update({
    "mypy_play.ga.tracking_id": environ.get("MYPY_PLAY_GA_TRACKING_ID"),
})

application = app
