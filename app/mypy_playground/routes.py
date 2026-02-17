import dataclasses
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import PlainTextResponse
from prometheus_client import REGISTRY, exposition

from mypy_playground import gist
from mypy_playground.config import Settings, get_settings
from mypy_playground.sandbox import run_typecheck_in_sandbox
from mypy_playground.sandbox.base import (
    ARGUMENT_FLAGS,
    ARGUMENT_MULTI_SELECT_OPTIONS,
    AbstractSandbox,
)
from mypy_playground.schemas import (
    ContextResponse,
    GistRequest,
    GistResponse,
    TypecheckRequest,
    TypecheckResponse,
)

logger = logging.getLogger(__name__)

initial_code = """from typing import Iterator


def fib(n: int) -> Iterator[int]:
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b


fib(10)
fib("10")
"""

# Create API router
api_router = APIRouter(prefix="/api")


@api_router.get("/context", response_model=ContextResponse)
async def get_context(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ContextResponse:
    """Get playground context including available Python and mypy versions"""
    mypy_versions = settings.mypy_versions
    config: dict[str, bool | str | list[str]] = {flag: False for flag in ARGUMENT_FLAGS}
    for option in ARGUMENT_MULTI_SELECT_OPTIONS:
        config[option] = []
    config["mypyVersion"] = mypy_versions[0][1]
    config["pythonVersion"] = settings.default_python_version

    # Make sure that the context type matches with app/frontend/types.tsx
    context = ContextResponse(
        defaultConfig=config,
        initialCode=initial_code,
        pythonVersions=settings.python_versions,
        mypyVersions=mypy_versions,
        flags=ARGUMENT_FLAGS,
        multiSelectOptions=ARGUMENT_MULTI_SELECT_OPTIONS,
        gaTrackingId=settings.ga_tracking_id,
    )
    return context


@api_router.post("/typecheck", response_model=TypecheckResponse)
async def typecheck(
    request: TypecheckRequest,
    raw_request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> TypecheckResponse:
    """Run mypy type-checking on the provided source code"""
    sandbox: AbstractSandbox = raw_request.app.state.sandbox
    source = request.source

    args: dict[str, str | bool | list[str]] = {}
    # Validate and add python_version
    if (
        request.pythonVersion is not None
        and request.pythonVersion in settings.python_versions
    ):
        args["python_version"] = request.pythonVersion

    # Add boolean flags from ARGUMENT_FLAGS
    for flag in ARGUMENT_FLAGS:
        # Convert hyphens to underscores for the field name
        field_name = flag.replace("-", "_")
        flag_value = getattr(request, field_name, None)
        if flag_value is True:
            args[flag] = True

    # Add multi-select options from ARGUMENT_MULTI_SELECT_OPTIONS
    for option, choices in ARGUMENT_MULTI_SELECT_OPTIONS.items():
        # Convert hyphens to underscores for the field name
        field_name = option.replace("-", "_")
        option_value = getattr(request, field_name, None)
        if not isinstance(option_value, list):
            continue
        option_values = [value for value in option_value if value in choices]
        if len(option_values) == 0:
            continue
        args[option] = option_values

    # Set mypy version
    if request.mypyVersion:
        args["mypy_version"] = request.mypyVersion
    else:
        # Use the first item as the default
        args["mypy_version"] = settings.mypy_versions[0][1]

    result = await run_typecheck_in_sandbox(sandbox, source, **args)  # type: ignore[arg-type]
    if result is None:
        logger.error("an error occurred during running type-check")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="an error occurred during running mypy",
        )

    return TypecheckResponse(**dataclasses.asdict(result))


@api_router.post(
    "/gist", response_model=GistResponse, status_code=status.HTTP_201_CREATED
)
async def create_gist_endpoint(request: GistRequest) -> GistResponse:
    """Create a GitHub gist with the provided source code"""
    source = request.source

    result = await gist.create_gist(source)

    if result is None:
        logger.error("an error occurred during creating a gist")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="an error occurred during creating a gist",
        )

    return GistResponse(**result)


# Create private router for Prometheus metrics
private_router = APIRouter(prefix="/private")


@private_router.get("/metrics")
async def prometheus_metrics() -> PlainTextResponse:
    """Expose Prometheus metrics"""
    accept_header = ""  # FastAPI doesn't provide this easily, use default
    encoder, content_type = exposition.choose_encoder(accept_header)
    output = encoder(REGISTRY)
    return PlainTextResponse(output, media_type=content_type)
