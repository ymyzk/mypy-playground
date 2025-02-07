from collections.abc import Generator
from typing import Any

import pytest
from pytest_mock import MockerFixture
from tornado.options import define, options

from mypy_playground.utils import (
    DictOption,
    ListPairOption,
    parse_environment_variables,
    parse_toml_file,
)


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
        ([["a", "b"], ["c", "d"]], [("a", "b"), ("c", "d")]),
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

    with pytest.raises(TypeError):
        config = ["nonpair"]
        ListPairOption(config)

    with pytest.raises(TypeError):
        ListPairOption([["a"]])


@pytest.fixture(autouse=True)
def test_options() -> Generator[None]:
    define("opt_int", type=int)
    define("opt_str", type=str)
    define("opt_dict", type=DictOption)
    define("opt_list_pair", type=ListPairOption)

    yield

    del options._options["opt-int"]
    del options._options["opt-str"]
    del options._options["opt-dict"]
    del options._options["opt-list-pair"]


def test_parse_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPT_INT", "123")
    monkeypatch.setenv("OPT_STR", "abc")
    monkeypatch.setenv("OPT_DICT", "a:b,c:d")
    monkeypatch.setenv("OPT_LIST_PAIR", "e:f,g:h")

    parse_environment_variables()

    assert options.opt_int == 123
    assert options.opt_str == "abc"
    assert options.opt_dict == {
        "a": "b",
        "c": "d",
    }
    assert options.opt_list_pair == [
        ("e", "f"),
        ("g", "h"),
    ]


def test_parse_toml_file(
    mocker: MockerFixture, monkeypatch: pytest.MonkeyPatch
) -> None:
    mock_path = mocker.MagicMock()
    mock_path.is_file.return_value = True
    m = mocker.mock_open(
        read_data=b"""
opt-int = 123
opt-str = "abc"
opt-list-pair = [
    ["e", "f"],
    ["g", "h"],
]

[opt-dict]
a = "b"
c = "d"
"""
    )
    mocker.patch("mypy_playground.utils.open", m)
    # monkeypatch.setenv("OPT_INT", "123")
    # monkeypatch.setenv("OPT_STR", "abc")
    # monkeypatch.setenv("OPT_DICT", "a:b,c:d")
    # monkeypatch.setenv("OPT_LIST_PAIR", "e:f,g:h")

    parse_toml_file(mock_path)

    assert options.opt_int == 123
    assert options.opt_str == "abc"
    assert options.opt_dict == {
        "a": "b",
        "c": "d",
    }
    assert options.opt_list_pair == [
        ("e", "f"),
        ("g", "h"),
    ]
