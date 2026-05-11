import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from django.core.files.base import ContentFile
from django.utils.text import slugify
from PIL import Image, ImageOps


def _run_command(command: list[str]) -> bool:
    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except (OSError, subprocess.CalledProcessError):
        return False
    return True


def _generate_with_ffmpeg(video_path: Path, output_dir: Path) -> Path | None:
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        return None

    output_path = output_dir / "video-thumbnail.jpg"
    succeeded = _run_command(
        [
            ffmpeg_path,
            "-y",
            "-i",
            str(video_path),
            "-vf",
            "thumbnail=240,scale=1280:-1",
            "-frames:v",
            "1",
            str(output_path),
        ]
    )
    if succeeded and output_path.exists():
        return output_path
    return None


def _generate_with_quicklook(video_path: Path, output_dir: Path) -> Path | None:
    if sys.platform != "darwin":
        return None

    qlmanage_path = shutil.which("qlmanage")
    if not qlmanage_path:
        return None

    succeeded = _run_command(
        [
            qlmanage_path,
            "-t",
            "-s",
            "1280",
            "-o",
            str(output_dir),
            str(video_path),
        ]
    )
    if not succeeded:
        return None

    matches = sorted(output_dir.glob(f"{video_path.name}*.png"))
    if not matches:
        matches = sorted(output_dir.glob("*.png"))
    return matches[0] if matches else None


def generate_representative_thumbnail(video_field, title: str) -> ContentFile | None:
    try:
        video_path = Path(video_field.path)
    except (AttributeError, NotImplementedError, ValueError):
        return None

    if not video_path.exists():
        return None

    with tempfile.TemporaryDirectory(prefix="news-video-thumb-") as tmpdir:
        output_dir = Path(tmpdir)
        generated_path = _generate_with_ffmpeg(video_path, output_dir)
        if generated_path is None:
            generated_path = _generate_with_quicklook(video_path, output_dir)
        if generated_path is None or not generated_path.exists():
            return None

        with Image.open(generated_path) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            if normalized.width > 1280:
                normalized.thumbnail((1280, 1280))

            content = tempfile.SpooledTemporaryFile()
            normalized.save(content, format="JPEG", quality=88, optimize=True)
            content.seek(0)
            payload = content.read()

    filename = f"{slugify(title) or video_path.stem}-thumbnail.jpg"
    return ContentFile(payload, name=filename)
