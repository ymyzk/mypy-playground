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
  latest=./latest
  sandbox_name="$version"
elif [[ "$package" == "basedmypy" ]]; then
  latest=./basedmypy-latest
  sandbox_name="${package}-${version}"
else
  echo "Unknown package: $package" >&2
  echo "usage: $0 [mypy|basedmypy] <version>" 1>&2
  exit 1
fi

cd "${sandbox_dir}/cloud_functions"
rm $latest
ln -s "$sandbox_name" $latest

cd "${sandbox_dir}/docker"
rm $latest
ln -s "$sandbox_name" $latest
