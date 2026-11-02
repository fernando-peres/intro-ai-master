"""Recorded runs for offline use: `recordings/<mode>.json` maps each preset question to a Run."""

import json
from pathlib import Path

from w_and_a.engine.events import Run

RECORDINGS = Path(__file__).resolve().parents[1] / "recordings"


def path_for(mode: str, directory: Path = RECORDINGS) -> Path:
    return directory / f"{mode}.json"


def load(mode: str, directory: Path = RECORDINGS) -> dict[str, Run]:
    path = path_for(mode, directory)
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {q: Run.from_dict({**run, "recorded": True}) for q, run in data.items()}


def recorded(mode: str, question: str, directory: Path = RECORDINGS) -> Run | None:
    return load(mode, directory).get(question)


def save(mode: str, runs: dict[str, Run], directory: Path = RECORDINGS) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = path_for(mode, directory)
    payload = {q: run.to_dict() for q, run in runs.items()}
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path
