"""`uv run w-and-a-record`: run every preset question in every tab and save it for offline replay.
Needs `OPENAI_API_KEY`; each call is billed."""

import sys

from w_and_a.engine import replay
from w_and_a.engine.data import PRESETS
from w_and_a.engine.llm import live_llm
from w_and_a.engine.modes import MODES


def main() -> None:
    llm = live_llm()
    if llm is None:
        sys.exit("OPENAI_API_KEY is not set in the repo-root .env")
    for mode, runner in MODES.items():
        runs = {}
        for question in PRESETS:
            print(f"{mode}: {question}", flush=True)
            runs[question] = runner(question, llm)
        print(f"  saved {replay.save(mode, runs)}")


if __name__ == "__main__":
    main()
