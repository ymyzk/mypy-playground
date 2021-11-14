FROM python:3.9-slim AS dependencies

WORKDIR /tmp
COPY ./requirements.txt /tmp/

RUN apt-get update \
        && apt-get install -y --no-install-recommends git \
        && pip install -r requirements.txt

FROM python:3.9-slim

WORKDIR /tmp

COPY --from=dependencies /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

USER nobody
CMD ["mypy"]
