FROM python:3.13-alpine

ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock /app/
RUN apk add --no-cache --virtual build-deps build-base \
        && uv sync --frozen \
        && apk del build-deps
RUN apk add --no-cache tini

COPY . /app

EXPOSE 8080
CMD ["/sbin/tini", "/app/.venv/bin/python", "-m", "mypy_playground"]
