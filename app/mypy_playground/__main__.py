import tornado.ioloop
from tornado.options import options, parse_command_line

from .app import make_app


parse_command_line()
app = make_app(debug=options.debug)
app.listen(options.port)
tornado.ioloop.IOLoop.current().start()
