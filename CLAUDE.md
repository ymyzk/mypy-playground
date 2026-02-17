# CLAUDE.md

## Project Overview

mypy-playground is a web-based interactive playground for the mypy type checker. Users write Python code with type hints, run mypy, and share snippets via GitHub Gist. Live at https://mypy-play.net.

## Project Structure

- `app/` — Main application (backend + frontend)
  - `app/mypy_playground/` — Python backend (FastAPI)
  - `app/frontend/` — React + TypeScript frontend (Vite)
  - `app/tests/` — Python tests (pytest)
- `sandbox/` — Docker images (75+ mypy versions) and Cloud Functions for sandboxed mypy execution
- `docker-compose.yml` — Local development environment

## Tech Stack

- **Backend**: Python 3.14, FastAPI, uvicorn, aiodocker, httpx, Pydantic, uv (package manager)
- **Frontend**: TypeScript, React 19, Vite, reactstrap, ace editor
- **Sandbox**: Docker (dind) or Google Cloud Functions
- **CI**: GitHub Actions

## Common Commands

### Backend (`app/`)

```bash
uv sync                                        # Install dependencies
uv run mypy .                                  # Type check (strict mode)
uv run pytest                                  # Run all tests
uv run pytest tests/test_app.py                # Run single test file
uv run pytest tests/test_app.py -k "context"   # Run tests matching pattern
uv run pre-commit run ruff-check --all-files   # Lint and fix
uv run pre-commit run ruff-format --all-files  # Format
uv run pre-commit run --all-files              # All pre-commit checks
```

### Frontend (`app/frontend/`)

```bash
npm ci                                          # Install dependencies
npm run build                                   # TypeScript check + Vite build
npm run lint                                    # ESLint
npm run format                                  # Prettier format
npm run test:ci                                 # Vitest (single run)
npm run test -- src/components/Result.test.tsx  # Single test file
npm run dev                                     # Dev server (port 5173)
```

### Local Development

```bash
docker compose up -d
docker compose exec docker docker build --pull \
  -t ymyzk/mypy-playground-sandbox:latest /sandbox/latest
# Frontend: http://localhost:8000 (Vite proxies /api/ to FastAPI on :8080)
```

## Code Style

- **Python**: Strict mypy, ruff (pycodestyle, pyflakes, isort, pyupgrade, bandit, bugbear), ruff format
- **TypeScript**: Strict mode, ESLint, Prettier (trailingComma: "all", tabWidth: 2, printWidth: 120)
- **Pre-commit hooks**: Configured via `.pre-commit-config.yaml` and enforced in CI

## Architecture Notes

### Request Flow
- **Dev**: Browser → Vite (:8000) → proxy `/api/` → FastAPI/uvicorn (:8080)
- **Prod**: Browser → FastAPI/uvicorn (serves static Vite build + API)

### Backend (`app/mypy_playground/`)
- **app.py**: Application factory (`create_app()`) with lifespan, exception handlers, SPA routing fallback, static file serving
- **routes.py**: Two routers — `api_router` (`/api/context`, `/api/typecheck`, `/api/gist`) and `private_router` (`/private/metrics`)
- **config.py**: Pydantic Settings with TOML + env var support. Precedence: env vars > `.env` > `config.toml` > defaults
- **schemas.py**: Pydantic request/response models for all API endpoints
- **dependencies.py**: FastAPI dependency injection for sandbox instances
- **middleware.py**: Prometheus metrics middleware (request count, duration, response size)
- **gist.py**: Async GitHub Gist creation via httpx

### Sandbox Abstraction (`app/mypy_playground/sandbox/`)
- **base.py**: `AbstractSandbox` ABC defining the interface; contains all mypy flag definitions (`ARGUMENT_FLAGS`, `ARGUMENT_MULTI_SELECT_OPTIONS`) and `Result` dataclass
- **docker.py**: `DockerSandbox` — creates isolated containers via aiodocker with resource limits (128MB memory, 32 PIDs, dropped capabilities)
- **cloud_functions.py**: `CloudFunctionsSandbox` — invokes Google Cloud Functions with identity token auth
- **`__init__.py`**: `run_typecheck_in_sandbox()` with `asyncio.Semaphore` for concurrency control

### Frontend (`app/frontend/src/`)
- **App.tsx**: Main component managing config state, URL sync (query params), localStorage persistence for source code
- **ContextProvider.tsx**: Fetches `/api/context` on mount, provides app-wide context via React Context API
- **Header.tsx**: Nav bar with run/gist buttons, version dropdowns, options modal (mypy flags)
- **Editor.tsx**: Ace editor with Python syntax highlighting and error annotations
- **Result.tsx**: Typecheck result display
- **utils/api.ts**: `runTypecheck()` with 30s timeout; **utils/gist.ts**: gist share/fetch

### CI Pipeline (`.github/workflows/ci.yml`)
1. **test_frontend**: Build, format check, lint, test
2. **test_app** (depends on test_frontend): Downloads frontend artifact, runs mypy + pre-commit + pytest
3. **build_docker_images** (master only): Builds app + all sandbox images, pushes to Docker Hub

### Testing
- **Backend**: pytest with pytest-asyncio (`asyncio_mode = "auto"`), pytest-cov, pytest-mock. Coverage via `--cov=mypy_playground`
- **Frontend**: Vitest with React Testing Library
