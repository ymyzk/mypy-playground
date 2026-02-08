# CLAUDE.md

## Project Overview

mypy-playground is a web-based interactive playground for the mypy type checker. Users write Python code with type hints, run mypy, and share snippets via GitHub Gist. Live at https://mypy-play.net.

## Project Structure

- `app/` — Main application (backend + frontend)
  - `app/mypy_playground/` — Python backend (Tornado)
  - `app/frontend/` — React + TypeScript frontend (Vite)
  - `app/tests/` — Python tests (pytest)
- `sandbox/` — Docker images and Cloud Functions for sandboxed mypy execution
- `docker-compose.yml` — Local development environment

## Tech Stack

- **Backend**: Python 3.13, Tornado, aiodocker, uv (package manager)
- **Frontend**: TypeScript, React 19, Vite, reactstrap, ace editor
- **Sandbox**: Docker (dind) or Google Cloud Functions
- **CI**: GitHub Actions

## Common Commands

### Backend (`app/`)

```bash
uv sync                                        # Install dependencies
uv run mypy .                                  # Type check (strict mode)
uv run pytest                                  # Run tests
uv run pre-commit run ruff-check --all-files   # Lint and fix
uv run pre-commit run ruff-format --all-files  # Format
uv run pre-commit run --all-files              # All pre-commit checks
```

### Frontend (`app/frontend/`)

```bash
npm ci                    # Install dependencies
npm run build             # TypeScript check + Vite build
npm run lint              # ESLint
npm run format            # Prettier format
npm run test:ci           # Vitest (single run)
npm run dev               # Dev server (port 5173)
```

### Local Development

```bash
docker compose up -d
docker compose exec docker docker build --pull \
  -t ymyzk/mypy-playground-sandbox:latest /sandbox/latest
# Frontend: http://localhost:8000 (Vite proxies /api/ to Tornado on :8080)
```

## Code Style

- **Python**: Strict mypy, ruff (pycodestyle, pyflakes, isort, pyupgrade, bandit, bugbear), ruff format
- **TypeScript**: Strict mode, ESLint, Prettier (trailingComma: "all", tabWidth: 2, printWidth: 120)
- **Pre-commit hooks**: Configured and enforced in CI

## Architecture Notes

- **Dev request flow**: Browser → Vite (:8000) → proxy `/api/` → Tornado (:8080)
- **Prod request flow**: Browser → Tornado (serves static Vite build)
- **Config precedence**: CLI args > env vars > config.toml > defaults
