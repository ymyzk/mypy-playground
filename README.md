# mypy-plyground

[![Build Status](https://travis-ci.org/ymyzk/mypy-playground.svg?branch=master)](https://travis-ci.org/ymyzk/mypy-playground)

The mypy playground

## Development
1. Run `docker-compose up -d` to start an app and Docker for running mypy
2. Run `docker-compose exec docker ash -c "cd /sandbox; docker build --pull -t ymyzk/mypy-playground:sandbox ."` to build a Docker image
3. Open http://localhost:8080

## Components
- [app](app): Application server
- [sandbox](sandbox): A Docker image for running mypy
