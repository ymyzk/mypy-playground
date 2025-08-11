#!/bin/bash

set -eu

cd "$(dirname "$0")"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 [mypy|basedmypy]" >&2
  exit 1
fi

readonly package="$1"
if [[ "$package" == "mypy" ]]; then
  local_version_symlink="./cloud_functions/latest"
elif [[ "$package" == "basedmypy" ]]; then
  local_version_symlink="./cloud_functions/basedmypy-latest"
else
  echo "Unknown package: $package" >&2
  echo "Usage: $0 [mypy|basedmypy]" >&2
  exit 1
fi

local_version=$(basename "$(readlink "$local_version_symlink")")
if [[ "$package" == "basedmypy" ]]; then
  local_version="${local_version#basedmypy-}"
fi

echo "Package: $package" >&2
echo "Local version: $local_version" >&2
echo "New versions from PyPI:" >&2

# TODO: EXIT CODE
# Get all versions from PyPI
pypi_versions=$(curl -s "https://pypi.org/pypi/$package/json" | jq -r '.releases | keys[]' | sort -V)

# Print new versions (those greater than the latest version)
for ver in $pypi_versions; do
  # Use version-aware comparison
  if [[ "$(printf '%s\n' "$ver" "$local_version" | sort -V | tail -n1)" == "$ver" && "$ver" != "$local_version" ]]; then
    echo "$ver"
  fi
done
