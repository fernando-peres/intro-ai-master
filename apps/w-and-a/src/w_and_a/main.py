"""`uv run w-and-a`: Streamlit started in the app folder, where `.streamlit/` lives."""

import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parents[2]


def main() -> None:
    from streamlit.web import cli

    os.chdir(APP_DIR)
    sys.argv = ["streamlit", "run", str(Path(__file__).with_name("app.py")), *sys.argv[1:]]
    sys.exit(cli.main())


if __name__ == "__main__":
    main()
