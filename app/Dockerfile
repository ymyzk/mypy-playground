FROM python:3.7-alpine

ENV PYTHONUNBUFFERED 1

RUN pip install --no-cache-dir pipenv

WORKDIR /app

COPY Pipfile Pipfile.lock /app/
RUN pipenv install --system \
        && rm -rf /root/.cache

COPY . /app

EXPOSE 8080
CMD ["python", "-m", "mypy_playground"]
