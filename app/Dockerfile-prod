FROM node:24

COPY ./frontend/package.json ./frontend/package-lock.json /app/
WORKDIR /app

RUN npm i && rm -rf /root/.node-gyp /root/.npm

COPY ./frontend/ /app/

RUN npm run build


FROM python:3.14-alpine

ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY --from=0 /app/dist/ /app/static/
COPY pyproject.toml uv.lock /app/
RUN apk add --no-cache --virtual build-deps build-base \
        && uv sync --frozen --no-dev --no-editable \
        && apk del build-deps
RUN apk add --no-cache tini

COPY . /app

EXPOSE 8080
CMD ["/sbin/tini", "/app/.venv/bin/fastapi", "run", "mypy_playground/app.py", "--host", "0.0.0.0", "--port", "8080"]
