from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def _isolate_config(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Isolate tests from local config files (config.toml, .env)."""
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("DEBUG", raising=False)
    monkeypatch.delenv("PORT", raising=False)
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("ENABLE_PROMETHEUS", raising=False)
