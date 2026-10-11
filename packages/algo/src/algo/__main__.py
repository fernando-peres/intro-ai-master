"""Entry point: `uv run algo` or `python -m algo`."""

from algo import GREETING


def main() -> None:
    print(GREETING)


if __name__ == "__main__":
    main()
