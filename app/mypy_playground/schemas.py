from pydantic import BaseModel, Field


class TypecheckRequest(BaseModel):
    """Request model for typecheck endpoint"""

    source: str = Field(..., description="Python source code to type-check")
    pythonVersion: str | None = Field(
        None, description="Python version to use for type-checking"
    )
    mypyVersion: str | None = Field(None, description="Mypy version to use")

    # Boolean flags from ARGUMENT_FLAGS
    verbose: bool | None = None
    ignore_missing_imports: bool | None = Field(None, alias="ignore-missing-imports")
    show_error_context: bool | None = Field(None, alias="show-error-context")
    stats: bool | None = None
    inferstats: bool | None = None
    version: bool | None = None
    show_traceback: bool | None = Field(None, alias="show-traceback")
    scripts_are_modules: bool | None = Field(None, alias="scripts-are-modules")
    show_column_numbers: bool | None = Field(None, alias="show-column-numbers")
    show_error_codes: bool | None = Field(None, alias="show-error-codes")
    enable_recursive_aliases: bool | None = Field(
        None, alias="enable-recursive-aliases"
    )
    implicit_optional: bool | None = Field(None, alias="implicit-optional")
    new_type_inference: bool | None = Field(None, alias="new-type-inference")

    allow_redefinition: bool | None = Field(None, alias="allow-redefinition")
    allow_redefinition_new: bool | None = Field(None, alias="allow-redefinition-new")
    allow_untyped_globals: bool | None = Field(None, alias="allow-untyped-globals")
    strict: bool | None = None
    strict_bytes: bool | None = Field(None, alias="strict-bytes")
    check_untyped_defs: bool | None = Field(None, alias="check-untyped-defs")
    disallow_any_decorated: bool | None = Field(None, alias="disallow-any-decorated")
    disallow_any_expr: bool | None = Field(None, alias="disallow-any-expr")
    disallow_any_explicit: bool | None = Field(None, alias="disallow-any-explicit")
    disallow_any_generics: bool | None = Field(None, alias="disallow-any-generics")
    disallow_any_unimported: bool | None = Field(None, alias="disallow-any-unimported")
    disallow_incomplete_defs: bool | None = Field(
        None, alias="disallow-incomplete-defs"
    )
    disallow_subclassing_any: bool | None = Field(
        None, alias="disallow-subclassing-any"
    )
    disallow_untyped_calls: bool | None = Field(None, alias="disallow-untyped-calls")
    disallow_untyped_decorators: bool | None = Field(
        None, alias="disallow-untyped-decorators"
    )
    disallow_untyped_defs: bool | None = Field(None, alias="disallow-untyped-defs")
    no_implicit_reexport: bool | None = Field(None, alias="no-implicit-reexport")
    local_partial_types: bool | None = Field(None, alias="local-partial-types")
    no_strict_optional: bool | None = Field(None, alias="no-strict-optional")
    no_warn_no_return: bool | None = Field(None, alias="no-warn-no-return")
    strict_equality: bool | None = Field(None, alias="strict-equality")
    strict_equality_for_none: bool | None = Field(
        None, alias="strict-equality-for-none"
    )
    warn_incomplete_stub: bool | None = Field(None, alias="warn-incomplete-stub")
    warn_redundant_casts: bool | None = Field(None, alias="warn-redundant-casts")
    warn_return_any: bool | None = Field(None, alias="warn-return-any")
    warn_unreachable: bool | None = Field(None, alias="warn-unreachable")
    warn_unused_configs: bool | None = Field(None, alias="warn-unused-configs")
    warn_unused_ignores: bool | None = Field(None, alias="warn-unused-ignores")
    extra_checks: bool | None = Field(None, alias="extra-checks")

    # Multi-select options from ARGUMENT_MULTI_SELECT_OPTIONS
    enable_incomplete_feature: list[str] | None = Field(
        None, alias="enable-incomplete-feature"
    )
    enable_error_code: list[str] | None = Field(None, alias="enable-error-code")

    model_config = {"populate_by_name": True}


class TypecheckResponse(BaseModel):
    """Response model for typecheck endpoint"""

    exit_code: int = Field(..., description="Exit code from mypy")
    stdout: str = Field(..., description="Standard output from mypy")
    stderr: str = Field(..., description="Standard error from mypy")
    duration: int = Field(..., description="Duration in milliseconds")


class GistRequest(BaseModel):
    """Request model for gist creation endpoint"""

    source: str = Field(..., description="Python source code to share in gist")


class GistResponse(BaseModel):
    """Response model for gist creation endpoint"""

    id: str = Field(..., description="Gist ID")
    url: str = Field(..., description="Gist URL")
    source: str = Field(..., description="Source code in the gist")


class ContextResponse(BaseModel):
    """Response model for context endpoint"""

    defaultConfig: dict[str, bool | str | list[str]] = Field(
        ..., description="Default configuration for the playground"
    )
    initialCode: str = Field(..., description="Initial code to display")
    pythonVersions: list[str] = Field(..., description="Available Python versions")
    mypyVersions: list[tuple[str, str]] = Field(
        ..., description="Available mypy versions as (display_name, version_id) pairs"
    )
    flags: tuple[str, ...] = Field(..., description="Available mypy flags")
    multiSelectOptions: dict[str, tuple[str, ...]] = Field(
        ..., description="Available multi-select options"
    )
    gaTrackingId: str | None = Field(
        None, description="Google Analytics tracking ID if configured"
    )


class ErrorResponse(BaseModel):
    """Error response model"""

    message: str = Field(..., description="Error message")
    traceback: str | None = Field(None, description="Traceback (only in debug mode)")
