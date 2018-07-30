FROM python:3.7-alpine

RUN pip install --no-cache-dir pipenv

WORKDIR /app

COPY Pipfile Pipfile.lock /app/
RUN pipenv lock -r > requirements.txt

FROM python:3.7-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /app

COPY --from=0 /app/requirements.txt /app/
RUN cat ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8080
CMD ["python", "-m", "mypy_playground"]
