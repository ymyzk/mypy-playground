# Sandbox
This directory contains Dockerfile for sandbox environment and utility scripts.

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
