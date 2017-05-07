FROM python:3.6-slim

RUN pip install mypy \
        && rm -rf /root/.cache

USER nobody
WORKDIR /tmp

CMD mypy
