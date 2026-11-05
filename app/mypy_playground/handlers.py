import json
import logging
import traceback
from http import HTTPStatus
from typing import Any

import tornado.escape
import tornado.web
from tornado.options import options

from . import gist

logger = logging.getLogger(__name__)
initial_code = """
def make_bigger(n: int) -> int:
  '''
  post: __return__ != 0
  '''
  return 2 * n + 10

"""


class IndexHandler(tornado.web.RequestHandler):
    async def get(self) -> None:
        context = {
            "initial_code": initial_code,
            "ga_tracking_id": options.ga_tracking_id,
        }
        self.render("index.html", context=json.dumps(context))


class JsonRequestHandler(tornado.web.RequestHandler):
    def prepare(self) -> None:
        content_type = self.request.headers.get("Content-Type", "")
        if not content_type.startswith("application/json"):
            raise tornado.web.HTTPError(
                HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
                log_message="Content-type must be application/json",
            )

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        error = {}

        if "exc_info" in kwargs:
            exc_info = kwargs["exc_info"]
            if self.settings.get("serve_traceback"):
                # in debug mode, try to send a traceback
                lines = traceback.format_exception(*exc_info)
                error["traceback"] = "\n".join(lines)

            exc = exc_info[1]
            if isinstance(exc, tornado.web.HTTPError) and exc.log_message:
                error["message"] = exc.log_message

        self.finish(error)

    def parse_json_request_body(self) -> Any:
        try:
            return tornado.escape.json_decode(self.request.body)
        except json.JSONDecodeError:
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST, log_message="failed to parse JSON body"
            )


class GistHandler(JsonRequestHandler):
    async def post(self) -> None:
        json = self.parse_json_request_body()

        source = json.get("source")
        if source is None or not isinstance(source, str):
            raise tornado.web.HTTPError(
                HTTPStatus.BAD_REQUEST, log_message="'source' is required"
            )

        result = await gist.create_gist(source)

        if result is None:
            logger.error("an error occurred during creating a gist")
            raise tornado.web.HTTPError(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                log_message="an error occurred during creating a gist",
            )

        self.set_status(201)
        self.write(result)
