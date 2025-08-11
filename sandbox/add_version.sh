#!/bin/bash
set -e
cd "$(dirname "$0")"
readonly sandbox_dir="$(pwd)"

if [ $# -ne 2 ]; then
  echo "usage: $0 [mypy|basedmypy] <version>" 1>&2
  exit 1
fi

set -u
readonly package="$1"
readonly version="$2"

if [[ "$package" == "mypy" ]]; then
  sandbox_name="$version"
elif [[ "$package" == "basedmypy" ]]; then
  sandbox_name="${package}-${version}"
else
  echo "Unknown package: $package" >&2
  echo "usage: $0 [mypy|basedmypy] <version>" 1>&2
  exit 1
fi
readonly cloud_functions_dir="${sandbox_dir}/cloud_functions/${sandbox_name}"
readonly docker_dir="${sandbox_dir}/docker/${sandbox_name}"

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
echo "${package}==${version}" > "requirements.in"
if [[ "$package" == "mypy" ]]; then
  echo "typing-extensions" >> "requirements.in"
fi
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
