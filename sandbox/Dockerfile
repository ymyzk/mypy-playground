FROM python:3.6-slim

RUN pip install mypy \
        && rm -rf /root/.cache

USER nobody

CMD mypy
