FROM python:3.8-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY requirements.txt /app/
RUN apk add --no-cache --virtual build-deps build-base \
        && pip install --no-cache-dir -r requirements.txt \
        && apk del build-deps

COPY . /app

EXPOSE 8080
CMD ["python", "-m", "mypy_playground"]
