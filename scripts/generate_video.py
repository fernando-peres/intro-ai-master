# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
"""Render a slide video: each image is shown for the length of its narration.

Pairs ``<src>/images/NN-<name>.(png|jpg)`` with ``<src>/audio/NN.(mp3|wav|m4a)``
by the two-digit prefix; anything else in those folders is ignored. Encodes in a
single ffmpeg pass with the ``concat`` filter, so audio is encoded once and stays
in sync across slides. Requires ``ffmpeg`` and ``ffprobe`` on PATH.

    uv run scripts/generate_video.py ~/Downloads/video-class-5 -o class-5.mp4
"""

import argparse
import re
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

IMAGE_RE = re.compile(r"^(\d{2})-.+\.(png|jpe?g)$", re.IGNORECASE)
AUDIO_RE = re.compile(r"^(\d{2})\.(mp3|wav|m4a)$", re.IGNORECASE)


def index_files(folder: Path, pattern: re.Pattern[str]) -> dict[int, Path]:
    """Map slide number to file; exit on duplicate numbers."""
    found: dict[int, Path] = {}
    for path in sorted(folder.iterdir()):
        match = pattern.match(path.name)
        if not match:
            continue
        n = int(match.group(1))
        if n in found:
            sys.exit(f"Duplicate slide {n:02d}: {found[n].name} and {path.name}")
        found[n] = path
    return found


def pair_slides(src: Path) -> list[tuple[int, Path, Path]]:
    """Return ``(n, image, audio)`` sorted by n; exit if numbering is incomplete."""
    images = index_files(src / "images", IMAGE_RE)
    audios = index_files(src / "audio", AUDIO_RE)
    numbers = images.keys() | audios.keys()
    problems = [
        *(f"  {n:02d}: no image" for n in sorted(audios.keys() - images.keys())),
        *(f"  {n:02d}: no audio" for n in sorted(images.keys() - audios.keys())),
        *(f"  {n:02d}: missing" for n in range(1, max(numbers, default=0) + 1) if n not in numbers),
    ]
    if not numbers or problems:
        sys.exit("Cannot pair slides:\n" + ("\n".join(problems) or "  no files found"))
    return [(n, images[n], audios[n]) for n in sorted(numbers)]


def audio_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(out.stdout.strip())


def build_command(
    slides: list[tuple[int, Path, Path, float]],
    output: Path,
    fps: int,
    width: int,
    height: int,
    pad_color: str,
) -> list[str]:
    cmd = ["ffmpeg", "-hide_banner", "-y"]
    filters: list[str] = []
    labels: list[str] = []
    for i, (_, image, audio, duration) in enumerate(slides):
        cmd += ["-loop", "1", "-framerate", str(fps), "-t", f"{duration:.3f}", "-i", str(image)]
        cmd += ["-i", str(audio)]
        v, a = 2 * i, 2 * i + 1
        filters.append(
            f"[{v}:v]scale={width}:{height}:force_original_aspect_ratio=decrease,"
            f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color={pad_color},"
            f"setsar=1,fps={fps},format=yuv420p[v{i}]"
        )
        filters.append(
            f"[{a}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
            f"apad=whole_dur={duration:.3f},atrim=duration={duration:.3f}[a{i}]"
        )
        labels.append(f"[v{i}][a{i}]")
    filters.append(f"{''.join(labels)}concat=n={len(slides)}:v=1:a=1[v][a]")
    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "medium", "-tune", "stillimage", "-crf", "20",
        "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart",
        str(output),
    ]  # fmt: skip
    return cmd


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("source_dir", nargs="?", type=Path, default=Path("~/Downloads/video-class-5"))
    parser.add_argument("-o", "--output", type=Path, help="default: <source_dir>/video.mp4")
    parser.add_argument("--padding", type=float, default=0.5, help="silence after each slide, seconds")
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--size", default="1920x1080", help="WIDTHxHEIGHT")
    parser.add_argument("--pad-color", default="white", help="letterbox color for off-ratio images")
    parser.add_argument("--dry-run", action="store_true", help="print slides and command, do not render")
    args = parser.parse_args()

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            sys.exit(f"{tool} not found on PATH")

    src = args.source_dir.expanduser().resolve()
    output = (args.output or src / "video.mp4").expanduser().resolve()
    width, height = (int(x) for x in args.size.lower().split("x"))

    slides = [(n, img, aud, audio_duration(aud) + args.padding) for n, img, aud in pair_slides(src)]
    total = sum(s[3] for s in slides)
    for n, image, audio, duration in slides:
        print(f"{n:02d}  {duration:7.2f}s  {audio.name:<8}  {image.name}")
    print(f"{len(slides)} slides, {total / 60:.1f} min -> {output}")

    cmd = build_command(slides, output, args.fps, width, height, args.pad_color)
    if args.dry_run:
        print(shlex.join(cmd))
        return
    subprocess.run(cmd, check=True)
    print(f"Done: {output}")


if __name__ == "__main__":
    main()
