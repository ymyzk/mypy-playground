# Sandbox
This directory contains sandbox environments for running mypy and utility scripts.

## Docker
Use Docker to run mypy. Images are currently available on Docker Hub.
[![dockeri.co](https://dockeri.co/image/ymyzk/mypy-playground-sandbox)](https://hub.docker.com/r/ymyzk/mypy-playground-sandbox)

## Tips for Development
### Updating mypy
```console
$ vim requirements.in
$ pip-compile -U
```

### Build all Docker images
```console
$ ./build.sh <image_name>
```

### Push all Docker images
```console
$ ./push.sh <image_name>
```
