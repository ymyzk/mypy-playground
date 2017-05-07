from os import path

import bottle
from bottle import abort, request, static_file, template

import sandbox


app = bottle.default_app()
root_dir = path.dirname(__file__)
static_dir = path.join(root_dir, "static")


@app.route("/")
def index():
    return template("index")


@app.route("/typecheck.json", method="POST")
def typecheck():
    source = request.json.get("source")
    if source is None or not isinstance(source, str):
        abort(400)
    result = sandbox.run_typecheck(source)
    return result


@app.route("/static/<filename>")
def server_static(filename):
    return static_file(filename, root=static_dir)


if __name__ == "__main__":
    app.run()
