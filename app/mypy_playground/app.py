import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from mypy_playground.config import get_settings
from mypy_playground.middleware import PrometheusMiddleware
from mypy_playground.routes import api_router, private_router
from mypy_playground.sandbox.base import AbstractSandbox
from mypy_playground.sandbox.cloud_functions import CloudFunctionsSandbox
from mypy_playground.sandbox.docker import DockerSandbox
from mypy_playground.schemas import ErrorResponse

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
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    """Lifespan context manager for startup and shutdown"""
    settings = get_settings()
    # Startup
    logger.info("Starting up mypy-playground")
    app.state.sandbox = _create_sandbox(settings.sandbox)
    yield
    # Shutdown
    logger.info("Shutting down mypy-playground")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
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

    # Custom exception handler for consistent error responses
    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle all exceptions with consistent JSON format"""
        # For HTTPException, use its detail
        if isinstance(exc, HTTPException):
            tb = None
            if settings.debug:
                import traceback

                tb = traceback.format_exc()
            error_response = ErrorResponse(
                message=exc.detail or "An error occurred", traceback=tb
            )
            return JSONResponse(
                status_code=exc.status_code,
                content=error_response.model_dump(exclude_none=True),
            )

        # For other exceptions, return 500
        tb = None
        if settings.debug:
            import traceback

            tb = traceback.format_exc()
        error_response = ErrorResponse(message="Internal server error", traceback=tb)
        return JSONResponse(
            status_code=500,
            content=error_response.model_dump(exclude_none=True),
        )

    # Custom 404 handler for SPA routing
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: HTTPException) -> Response:
        """Handle 404 errors: JSON for API paths, HTML for SPA routes"""
        path = request.url.path

        # For API and private paths, return JSON 404
        if path.startswith("/api/") or path.startswith("/private/"):
            error_response = ErrorResponse(message="Not found", traceback=None)
            return JSONResponse(
                status_code=404,
                content=error_response.model_dump(exclude_none=True),
            )

        # Fallback to index.html for SPA routing
        index_page = static_dir / "index.html"
        if index_page.is_file():
            return FileResponse(index_page, media_type="text/html")

        # If no static files exist, return basic 404
        return HTMLResponse(
            content="<h1>404 Not Found</h1>",
        )

    # Mount static files last (catch-all)
    # Note: This must be done last to ensure API routes take precedence
    if static_dir.is_dir():
        app.mount(
            "",
            StaticFiles(directory=str(static_dir)),
            name="static",
        )

    return app


# Create the app instance for uvicorn
app = create_app()
