import tornado.ioloop
from tornado.options import options

from mypy_playground.app import make_app


app = make_app(debug=options.debug)
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
