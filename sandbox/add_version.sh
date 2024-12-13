#!/bin/bash
set -e
cd "$(dirname "$0")"
readonly sandbox_dir="$(pwd)"

if [ -z "$1" ]; then
  echo "usage: $0 <version>" 1>&2
  exit 1
fi

set -u
readonly version="$1"
readonly cloud_functions_dir="${sandbox_dir}/cloud_functions/${version}"
readonly docker_dir="${sandbox_dir}/docker/${version}"

if [ -d "$cloud_functions_dir" ]; then
  echo "${cloud_functions_dir} already exists" 1>&2
  exit 1
fi
if [ -d "$docker_dir" ]; then
  echo "${docker_dir} already exists" 1>&2
  exit 1
fi

set -x

mkdir "$cloud_functions_dir"
cd "$cloud_functions_dir"
case $version in
  "basedmypy-"*)
    echo "basedmypy==${version#basedmypy-}" > "requirements.in"
    ;;
  *)
    echo "mypy==${version}
typing-extensions" > "requirements.in"
    ;;
esac
pip-compile
ln -s ../main.py ./
cd "$sandbox_dir"

mkdir "$docker_dir"
cd "$docker_dir"
cp "${cloud_functions_dir}/requirements.in" ./
cp "${cloud_functions_dir}/requirements.txt" ./
echo 'FROM python:3.13-slim

WORKDIR /tmp
COPY ./requirements.txt /tmp/

RUN pip install -r requirements.txt \
        && rm -rf /tmp/requirements.txt \
        && rm -rf /root/.cache

USER nobody
CMD ["mypy"]' > "Dockerfile"
cd "$sandbox_dir"
