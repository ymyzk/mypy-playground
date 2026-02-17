from typing import Any

import pytest

from mypy_playground.config import DictOption, ListPairOption, Settings


@pytest.mark.parametrize(
    "config,expected",
    [
        ("", {}),
        ("a:b", {"a": "b"}),
        ("a:b", {"a": "b"}),
        ("a:b:c", {"a": "b:c"}),
        ("a:b:c,d:e", {"a": "b:c", "d": "e"}),
        ({"a": "b", "c": "d"}, {"a": "b", "c": "d"}),
        ({"a": True, "c": 123}, {"a": "True", "c": "123"}),
    ],
)
def test_dict_option_succeeds(
    config: str | dict[str, Any], expected: dict[str, str]
) -> None:
    assert DictOption(config) == expected


def test_dict_option_raises_value_error() -> None:
    with pytest.raises(ValueError):
        DictOption("abc")


def test_dict_option_raises_type_error() -> None:
    with pytest.raises(TypeError):
        config: Any = 123
        DictOption(config)


@pytest.mark.parametrize(
    "config,expected",
    [
        ("", []),
        ("a:b", [("a", "b")]),
        ("a:b:c,d:e", [("a", "b:c"), ("d", "e")]),
        ([["a", "b"], ["c", "d"]], [("a", "b"), ("c", "d")]),
    ],
)
def test_list_pair_option_succeeds(
    config: str | list[list[str]], expected: list[tuple[str, str]]
) -> None:
    assert ListPairOption(config) == expected


def test_list_pair_option_raises_value_error() -> None:
    with pytest.raises(ValueError):
        ListPairOption("abc")


def test_list_pair_option_raises_type_error() -> None:
    with pytest.raises(TypeError):
        config: Any = 123
        ListPairOption(config)

    with pytest.raises(TypeError):
        config_list: Any = ["nonpair"]
        ListPairOption(config_list)

    with pytest.raises(TypeError):
        ListPairOption([["a"]])


def test_settings_defaults() -> None:
    """Test that default settings are created correctly"""
    settings = Settings()
    assert settings.port == 8080
    assert settings.debug is False
    assert settings.sandbox == "mypy_playground.sandbox.docker.DockerSandbox"
    assert settings.sandbox_concurrency == 3
    assert "3.14" in settings.python_versions


def test_settings_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that settings can be loaded from environment variables"""
    monkeypatch.setenv("PORT", "9000")
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("GITHUB_TOKEN", "test-token")

    settings = Settings()
    assert settings.port == 9000
    assert settings.debug is True
    assert settings.github_token == "test-token"  # noqa: S105
