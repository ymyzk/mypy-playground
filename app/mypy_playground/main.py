import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from mypy_playground.config import get_settings
from mypy_playground.middleware import PrometheusMiddleware
from mypy_playground.routes import api_router, private_router
from mypy_playground.sandbox.base import AbstractSandbox
from mypy_playground.sandbox.cloud_functions import CloudFunctionsSandbox
from mypy_playground.sandbox.docker import DockerSandbox

logger = logging.getLogger(__name__)
root_dir = Path(__file__).parents[1]
static_dir = root_dir / "static"


def _create_sandbox(sandbox_name: str) -> AbstractSandbox:
    if sandbox_name == "mypy_playground.sandbox.docker.DockerSandbox":
        return DockerSandbox()
    elif (
        sandbox_name == "mypy_playground.sandbox.cloud_functions.CloudFunctionsSandbox"
    ):
        return CloudFunctionsSandbox()
    raise ValueError(f"Unsupported sandbox: {sandbox_name}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Lifespan context manager for startup and shutdown"""
    settings = get_settings()
    # Startup
    logger.info("Starting up mypy-playground")
    app.state.sandbox = _create_sandbox(settings.sandbox)
    yield
    # Shutdown
    logger.info("Shutting down mypy-playground")


settings = get_settings()

app = FastAPI(
    title="mypy Playground",
    description="Interactive playground for mypy type checker",
    version="0.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# Add Prometheus middleware if enabled
if settings.enable_prometheus:
    app.add_middleware(PrometheusMiddleware)
    # Include private router for metrics endpoint
    app.include_router(private_router)

# Include API routes
app.include_router(api_router)

# Mount static files last (catch-all)
if static_dir.is_dir():
    app.mount(
        "/",
        StaticFiles(directory=str(static_dir), html=True),
        name="static",
    )
