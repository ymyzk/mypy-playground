#!/bin/bash
set -e

cd $(dirname $0)
cd ..

set -x

flake8
mypy .
