#!/bin/bash
set -e

cd $(dirname $0)
cd ..

set -x

flake8
mypy --python-version 3.6 --ignore-missing-imports --strict --allow-subclassing-any .
