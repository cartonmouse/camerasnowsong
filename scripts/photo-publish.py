import argparse
import json
from pathlib import Path
from urllib.parse import quote, unquote

try:
    from PIL import Image, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required. Install it with: python -m pip install pillow") from exc


THUMB_MAX_EDGE = 720
LARGE_MAX_EDGE = 2200
THUMB_QUALITY = 76
LARGE_QUALITY = 84


def public_path(path: Path, public_root: Path) -> str:
    relative = path.relative_to(public_root).as_posix()
    return "/" + "/".join(quote(part) for part in relative.split("/"))


def source_path_from_src(src: str, photos_root: Path) -> Path | None:
    prefix = "/photos/"
    if not isinstance(src, str) or not src.startswith(prefix):
        return None
    relative = unquote(src[len(prefix):])
    return photos_root / Path(relative)


def album_slug(record: dict) -> str:
    raw = record.get("album") or record.get("category") or "uncategorized"
    safe = []
    for char in str(raw).lower():
        if char.isascii() and char.isalnum():
            safe.append(char)
        elif char in ["-", "_"]:
            safe.append(char)
        else:
            safe.append("-")
    slug = "".join(safe).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "album"


def resize_image(source: Path, target: Path, max_edge: int, quality: int) -> tuple[int, int]:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=quality, method=6)
        return image.size


def publish_record(record: dict, *, photos_root: Path, public_root: Path, output_root: Path, force: bool = False) -> dict:
    source = source_path_from_src(record.get("originalSrc") or record.get("src"), photos_root)
    if source is None:
        return {**record, "publishStatus": record.get("publishStatus") or "skipped-non-local"}
    if not source.exists():
        return {**record, "publishStatus": "missing-source"}

    stem = record.get("id") or source.stem
    album = album_slug(record)
    thumb_path = output_root / "albums" / album / f"{stem}-thumb.webp"
    large_path = output_root / "albums" / album / f"{stem}-large.webp"

    if force or not thumb_path.exists():
        thumb_width, thumb_height = resize_image(source, thumb_path, THUMB_MAX_EDGE, THUMB_QUALITY)
    else:
        with Image.open(thumb_path) as image:
            thumb_width, thumb_height = image.size

    if force or not large_path.exists():
        width, height = resize_image(source, large_path, LARGE_MAX_EDGE, LARGE_QUALITY)
    else:
        with Image.open(large_path) as image:
            width, height = image.size

    original_src = record.get("originalSrc") or record.get("src")
    return {
        **record,
        "originalSrc": original_src,
        "thumb": public_path(thumb_path, public_root),
        "src": public_path(large_path, public_root),
        "width": width,
        "height": height,
        "thumbWidth": thumb_width,
        "thumbHeight": thumb_height,
        "publishStatus": "published"
    }


def publish_photos(project_root: Path, *, force: bool = False) -> dict:
    public_root = project_root / "public"
    photos_root = public_root / "photos"
    output_root = public_root / "site-photos"
    data_path = project_root / "src" / "data" / "photos.json"
    records = json.loads(data_path.read_text(encoding="utf-8"))

    next_records = [
        publish_record(
            record,
            photos_root=photos_root,
            public_root=public_root,
            output_root=output_root,
            force=force
        )
        for record in records
    ]
    data_path.write_text(json.dumps(next_records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    counts = {}
    for record in next_records:
        status = record.get("publishStatus", "unknown")
        counts[status] = counts.get(status, 0) + 1
    return {"dataPath": data_path, "records": len(next_records), "counts": counts}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate web publish images and update src/data/photos.json.")
    parser.add_argument("--force", action="store_true", help="Regenerate existing WebP files.")
    args = parser.parse_args()
    project_root = Path(__file__).resolve().parents[1]
    result = publish_photos(project_root, force=args.force)
    counts = ", ".join(f"{key}: {value}" for key, value in sorted(result["counts"].items()))
    print(f"Published image data for {result['records']} photos ({counts})")
    print(f"Updated {result['dataPath'].relative_to(project_root)}")


if __name__ == "__main__":
    main()
