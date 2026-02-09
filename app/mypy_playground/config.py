from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from pydantic import Field, field_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
    TomlConfigSettingsSource,
)


def _parse_pair_str(config: str) -> tuple[str, str]:
    pair = tuple(config.split(":", 1))
    if len(pair) != 2:
        raise ValueError(f"The given string is not a pair: {config}")
    return pair[0], pair[1]


def _parse_pair_list(config: Any) -> tuple[str, str]:
    if not isinstance(config, list):
        raise TypeError(f"The given config is not a list: {config}")
    if len(config) != 2:
        raise TypeError(f"The given list is not a pair: {config}")
    return str(config[0]), str(config[1])


class DictOption(dict[str, str]):
    """Custom dict[str, str] type for configuration

    Input 1: "a:b,c:d"
    Output 1: {"a": "b", "c": "d"}

    Input 2: {"a": "b", "c": "d"}
    Output 2: {"a": "b", "c": "d"}
    """

    def __init__(self, config: dict[str, str] | str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair_str(c) for c in config.split(","))
        elif isinstance(config, dict):
            super().__init__((str(k), str(v)) for k, v in config.items())
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")


class ListPairOption(list[tuple[str, str]]):
    """Custom list of pairs type for configuration

    Input 1: "a:b,c:d"
    Output 1: [("a", "b"), ("c", "d")]

    Input 2: [["a", "b"], ["c", "d"]]
    Output 2: [("a", "b"), ("c", "d")]
    """

    def __init__(self, config: list[list[str]] | str) -> None:
        if isinstance(config, str):
            if config.strip() == "":
                super().__init__()
                return
            super().__init__(_parse_pair_str(c) for c in config.split(","))
        elif isinstance(config, list):
            super().__init__(map(_parse_pair_list, config))
        else:
            raise TypeError(f"Unsupported type was given: {type(config)}")


class Settings(BaseSettings):
    """Application settings with support for TOML and environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="",
        env_file=".env",
        env_file_encoding="utf-8",
        alias_generator=lambda s: s.replace("_", "-"),
        populate_by_name=True,
        case_sensitive=False,
        extra="ignore",
        toml_file="config.toml",
    )

    sandbox: Literal[
        "mypy_playground.sandbox.docker.DockerSandbox",
        "mypy_playground.sandbox.cloud_functions.CloudFunctionsSandbox",
    ] = Field(
        default="mypy_playground.sandbox.docker.DockerSandbox",
        description="Sandbox implementation to use",
    )

    sandbox_concurrency: int = Field(
        default=3,
        description="The number of running sandboxes at the same time",
    )

    default_python_version: str = Field(
        default="3.14",
        description="Default Python version",
    )

    python_versions: list[str] = Field(
        default=["3.14", "3.13", "3.12", "3.11", "3.10", "3.9"],
        description="Python versions",
    )

    ga_tracking_id: str | None = Field(
        default=None,
        description="Google Analytics tracking ID",
    )

    github_token: str | None = Field(
        default=None,
        description="GitHub API token for creating gists",
    )

    mypy_versions: list[tuple[str, str]] = Field(
        default=[("mypy latest", "latest"), ("basedmypy latest", "basedmypy-latest")],
        description="List of mypy versions used by a sandbox",
    )

    enable_prometheus: bool = Field(
        default=False,
        description="Enable Prometheus metrics endpoint",
    )

    port: int = Field(
        default=8080,
        description="Port number",
    )

    debug: bool = Field(
        default=False,
        description="Debug mode",
    )

    docker_images: dict[str, str] = Field(
        default={"latest": "ymyzk/mypy-playground-sandbox:latest"},
        description="Docker images used by DockerSandbox",
    )

    # Cloud Functions settings
    cloud_functions_url: str | None = Field(
        default=None,
        description="Cloud Functions URL for sandbox",
    )

    cloud_functions_project_id: str | None = Field(
        default=None,
        description="Cloud Functions project ID",
    )

    cloud_functions_service_account_json_path: Path | None = Field(
        default=None,
        description="Path to service account JSON for Cloud Functions",
    )

    cloud_functions_identity_token: str | None = Field(
        default=None,
        description="Identity token for Cloud Functions (development use)",
    )

    cloud_function_names: dict[str, str] = Field(
        default={"latest": "mypy-latest"},
        description="Mapping of mypy version IDs to Cloud Function names",
    )

    @field_validator("mypy_versions", mode="before")
    @classmethod
    def parse_mypy_versions(cls, v: Any) -> list[tuple[str, str]]:
        """Parse mypy_versions from various input formats"""
        if isinstance(v, str):
            return list(ListPairOption(v))
        if isinstance(v, list):
            if all(isinstance(item, list) for item in v):
                return list(ListPairOption(v))
            if all(isinstance(item, tuple) for item in v):
                return [(str(k), str(v_inner)) for k, v_inner in v]
        # Already validated list of tuples
        return v  # type: ignore[no-any-return]

    @field_validator("docker_images", mode="before")
    @classmethod
    def parse_docker_images(cls, v: Any) -> dict[str, str]:
        """Parse docker_images from various input formats"""
        if isinstance(v, str):
            return dict(DictOption(v))
        if isinstance(v, dict):
            return {str(k): str(val) for k, val in v.items()}
        # Already validated dict
        return v  # type: ignore[no-any-return]

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        """Customize settings sources.

        Precedence: env > dotenv > TOML > defaults
        """
        return (
            env_settings,
            dotenv_settings,
            TomlConfigSettingsSource(settings_cls),
            init_settings,
        )


@lru_cache
def get_settings() -> Settings:
    """Get the global settings instance"""
    return Settings()
