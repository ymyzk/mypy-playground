FROM python:3.6

WORKDIR /tmp
COPY requirements.txt /tmp/

RUN pip install -r requirements.txt \
        && rm -rf /root/.cache

USER nobody
CMD ["mypy"]
