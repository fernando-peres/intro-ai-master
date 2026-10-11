"""Integration with packages/algo: apps may import packages."""

import algo


def test_algo_package_is_importable():
    assert algo.GREETING == "Hello, world!"
