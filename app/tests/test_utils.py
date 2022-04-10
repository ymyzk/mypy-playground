from typing import Any

import pytest

from mypy_playground.utils import (
    DictOption,
    ListPairOption,
)


@pytest.mark.parametrize(
    "config,expected",
    [
        ("", {}),
        ("a:b", {"a": "b"}),
        ("a:b", {"a": "b"}),
        ("a:b:c", {"a": "b:c"}),
        ("a:b:c,d:e", {"a": "b:c", "d": "e"}),
    ],
)
def test_dict_option_succeeds(config: str, expected: dict[str, str]) -> None:
    assert DictOption(config) == expected


def test_dict_option_raises_syntax_error() -> None:
    with pytest.raises(SyntaxError):
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
    ],
)
def test_list_pair_option_succeeds(
    config: str, expected: list[tuple[str, str]]
) -> None:
    assert ListPairOption(config) == expected


def test_list_pair_option_raises_syntax_error() -> None:
    with pytest.raises(SyntaxError):
        ListPairOption("abc")


def test_list_pair_option_raises_type_error() -> None:
    with pytest.raises(TypeError):
        config: Any = 123
        ListPairOption(config)
