from os import path

import bottle
from bottle import abort, request, static_file, template

import sandbox
from utils import setup_logger


app = bottle.default_app()
logger = setup_logger(__name__)
root_dir = path.dirname(__file__)
static_dir = path.join(root_dir, "static")
python_versions = [str(v) for v in (2.7, 3.3, 3.4, 3.5, 3.6)]


@app.route("/")
def index():
    context = {
        "python_versions": python_versions,
    }
    return template("index", **context)


@app.route("/typecheck.json", method="POST")
def typecheck():
    source = request.json.get("source")
    if source is None or not isinstance(source, str):
        abort(400)

    options = {}
    python_version = request.json.get("python_version")
    if python_version is not None and python_version in python_versions:
        options["python_version"] = python_version
    verbose = request.json.get("verbose")
    if verbose is not None and isinstance(verbose, bool):
        options["verbose"] = verbose

    result = sandbox.run_typecheck(source, **options)
    if result is None:
        logger.warn("an error occurred during running type-check")
        abort(500)

    return result


@app.route("/static/<filename>")
def server_static(filename):
    return static_file(filename, root=static_dir)


if __name__ == "__main__":
    app.run(debug=True, reloader=True)
else:
    application = app
