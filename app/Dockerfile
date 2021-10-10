FROM python:3.10-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN apk add --no-cache --virtual build-deps build-base \
        && pip install --no-cache-dir -r requirements.txt \
        && apk del build-deps
RUN apk add --no-cache tini

COPY . /app

EXPOSE 8080
CMD ["/sbin/tini", "python", "-m", "mypy_playground"]
