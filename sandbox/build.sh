#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ -n "$1" ]; then
  image_name="$1"
else
  image_name="mypy-playground-sandbox"
fi

set -u
find . -maxdepth 1 -mindepth 1 -type d,l -exec bash -c '
  dir="$1"
  tag=$(basename "$dir")
  docker build --pull -t "$2:$tag" "$dir"
' _ {} "$image_name" \;
