FROM python:3.10-slim

RUN apt-get update
RUN apt-get install -y --no-install-recommends build-essential gcc libc-dev tk make

WORKDIR /tmp

RUN pip install hypothesis icontract deal numpy  # optional packages
RUN pip install crosshair-tool==0.0.112

USER nobody
CMD ["/usr/local/bin/crosshair", "check"]
