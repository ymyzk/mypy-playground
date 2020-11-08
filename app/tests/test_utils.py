from pytest_mock import MockerFixture
from tornado.options import define, options

from mypy_playground.utils import get_mypy_versions, parse_option_as_dict


def test_parse_option_as_dict(mocker: MockerFixture) -> None:
    define("opt1")
    define("opt2")
    mocker.patch.object(options.mockable(), "opt1", "k1:v1,k2:v2")
    mocker.patch.object(options.mockable(), "opt2", "a:b:c")
    parse_option_as_dict.cache_clear()

    # Compare as a list to verify insertion order
    assert list(parse_option_as_dict("opt1").items()) == [
        ("k1", "v1"),
        ("k2", "v2"),
    ]
    # Case with multiple colons in the value
    assert parse_option_as_dict("opt2") == {
        "a": "b:c",
    }


def test_get_mypy_versions(mocker: MockerFixture) -> None:
    mocker.patch.object(options.mockable(), "mypy_versions", "mypy 0.790:0.790")
    get_mypy_versions.cache_clear()

    assert get_mypy_versions() == [
        ("mypy 0.790", "0.790")
    ]
