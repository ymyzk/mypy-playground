FROM python:3.7-slim

RUN pip install -U pipenv

WORKDIR /tmp
COPY Pipfile Pipfile.lock /tmp/

RUN pipenv lock -r > requirements.txt


FROM python:3.7-slim

WORKDIR /tmp
COPY --from=0 /tmp/requirements.txt /tmp/

RUN pip install -r requirements.txt \
        && rm -rf /tmp/requirements.txt \
        && rm -rf /root/.cache

USER nobody
CMD ["mypy"]
