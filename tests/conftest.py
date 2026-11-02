from __future__ import annotations

import pytest

from backend.app import main as main_module


@pytest.fixture(autouse=True)
def _reset_rate_limit_state():
    main_module._rate_buckets.clear()
    yield
    main_module._rate_buckets.clear()
