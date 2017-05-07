import bottle
from bottle import abort, request

import sandbox


app = bottle.default_app()


@app.route("/typecheck.json", method="POST")
def typecheck():
    source = request.json.get("source")
    if source is None or not isinstance(source, str):
        abort(400)
    result = sandbox.run_typecheck(source)
    return result


if __name__ == "__main__":
    app.run()
