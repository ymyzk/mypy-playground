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
case $version in
  basedmypy-*)
    readonly latest=./basedmypy-latest
    ;;
  *)
    readonly latest=./latest
    ;;
esac

cd "${sandbox_dir}/cloud_functions"
rm $latest
ln -s "$version" $latest

cd "${sandbox_dir}/docker"
rm $latest
ln -s "$version" $latest
